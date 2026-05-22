# Azure AKS Deployment Guide

Deploy TogetherLearn to Azure Kubernetes Service so it is publicly accessible on the internet.

**Branch for this deployment:** `deploy/azure-aks`

---

## Cost Estimate

| Resource | SKU | Monthly Cost |
|---|---|---|
| AKS node pool (2 × Standard_B4ms — 4 vCPU, 16 GB each) | Pay-as-you-go | ~$120 |
| AKS control plane | Free | $0 |
| Azure Load Balancer (1 public IP) | Basic | ~$4 |
| Azure Disk (persistent volumes — 7 × 10 GB) | Standard_LRS | ~$5 |
| Container images | Docker Hub (free) | $0 |
| **Total** | | **~$130/month** |

> **Azure for Students:** If you have a `.edu` email, sign up at [azure.microsoft.com/en-us/free/students](https://azure.microsoft.com/en-us/free/students) — you get **$100 free credit with no credit card required**. That covers ~3 weeks of this cluster.
>
> **Azure Free Trial:** New accounts get **$200 credit for 30 days** — enough to run the full cluster for a month.

---

## Prerequisites

Install these tools on your local machine:

```bash
# Azure CLI
# Windows: winget install Microsoft.AzureCLI
# Mac: brew install azure-cli
az version

# kubectl (if not already installed)
# Windows: winget install Kubernetes.kubectl
kubectl version --client

# Helm (for nginx ingress controller)
# Windows: winget install Helm.Helm
# Mac: brew install helm
helm version
```

---

## Part 1 — Azure Setup (One Time)

### Step 1 — Login to Azure

```bash
az login
```

A browser window opens. Sign in with your Azure account.

```bash
# Verify your subscription
az account show
```

### Step 2 — Create a Resource Group

```bash
az group create \
  --name togetherlearn-rg \
  --location eastus
```

Choose a location close to your users. Other options: `westeurope`, `southeastasia`, `australiaeast`.

### Step 3 — Create the AKS Cluster

```bash
az aks create \
  --resource-group togetherlearn-rg \
  --name togetherlearn-aks \
  --node-count 2 \
  --node-vm-size Standard_B4ms \
  --enable-managed-identity \
  --generate-ssh-keys \
  --node-osdisk-size 50
```

This takes 5–10 minutes.

> **Cheaper alternative (less RAM, may need to scale down services):**
> Use `--node-vm-size Standard_B2ms --node-count 3` for similar total resources at ~$90/month.

### Step 4 — Connect kubectl to Your Cluster

```bash
az aks get-credentials \
  --resource-group togetherlearn-rg \
  --name togetherlearn-aks

# Verify connection
kubectl get nodes
```

You should see 2 nodes in `Ready` state.

### Step 5 — Install nginx Ingress Controller

AKS does not come with an ingress controller. Install nginx:

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/azure-load-balancer-health-probe-request-path"=/healthz
```

Wait ~2 minutes, then get your public IP:

```bash
kubectl get svc ingress-nginx-controller -n ingress-nginx
```

Look for the `EXTERNAL-IP` column. Save this IP — you will point your domain to it.

```
NAME                       TYPE           EXTERNAL-IP      PORT(S)
ingress-nginx-controller   LoadBalancer   52.168.xx.xx     80:xxx, 443:xxx
```

### Step 6 — Install cert-manager (Free TLS)

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml

# Wait for cert-manager pods to be ready
kubectl wait --namespace cert-manager \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/instance=cert-manager \
  --timeout=120s
```

Create a ClusterIssuer for Let's Encrypt:

```bash
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
EOF
```

---

## Part 2 — Domain and DNS

### Option A — Use a Custom Domain

Buy a domain from Namecheap, GoDaddy, or Cloudflare Registrar (~$12/year for `.com`).

Create two DNS A records pointing to your nginx ingress IP:

| Type | Name | Value |
|---|---|---|
| A | `app` | `<nginx ingress EXTERNAL-IP>` |
| A | `api` | `<nginx ingress EXTERNAL-IP>` |

This gives you `https://app.yourdomain.com` and `https://api.yourdomain.com`.

### Option B — Use Azure DNS (Optional Paid Service)

```bash
az network dns zone create \
  --resource-group togetherlearn-rg \
  --name togetherlearn.app

# Add A records
az network dns record-set a add-record \
  --resource-group togetherlearn-rg \
  --zone-name togetherlearn.app \
  --record-set-name app \
  --ipv4-address <nginx-ingress-ip>

az network dns record-set a add-record \
  --resource-group togetherlearn-rg \
  --zone-name togetherlearn.app \
  --record-set-name api \
  --ipv4-address <nginx-ingress-ip>
```

### Update the Ingress Manifest

Edit [k8s/ingress/ingress.yaml](k8s/ingress/ingress.yaml) and update the hostnames:

```yaml
spec:
  ingressClassName: nginx        # ← add this line
  tls:
    - hosts:
        - app.yourdomain.com     # ← your domain
        - api.yourdomain.com
      secretName: tl-tls
  rules:
    - host: app.yourdomain.com   # ← your domain
    - host: api.yourdomain.com
```

Also add cert-manager annotation:

```yaml
metadata:
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
```

---

## Part 3 — Kubernetes Secrets

Update [k8s/secrets/app-secrets.yaml](k8s/secrets/app-secrets.yaml) with real production values before applying. Do NOT commit real secrets to git.

The safe way is to apply secrets directly from the command line:

```bash
kubectl create namespace togetherlearn

kubectl create secret generic tl-secrets \
  --namespace togetherlearn \
  --from-literal=jwt-secret="$(openssl rand -hex 32)" \
  --from-literal=db-password="$(openssl rand -base64 24)" \
  --from-literal=redis-password="$(openssl rand -base64 24)" \
  --from-literal=rabbitmq-uri="amqp://tl:$(openssl rand -base64 16)@rabbitmq:5672" \
  --from-literal=minio-access-key="minio" \
  --from-literal=minio-secret-key="$(openssl rand -base64 24)" \
  --from-literal=grafana-password="$(openssl rand -base64 16)"
```

Save the generated values somewhere safe — you will need them if you recreate the cluster.

---

## Part 4 — GitHub Actions CI/CD Setup

### Step 1 — Create Azure Service Principal

This gives GitHub Actions permission to deploy to your cluster:

```bash
# Get your subscription ID
az account show --query id -o tsv

# Create service principal
az ad sp create-for-rbac \
  --name togetherlearn-github-actions \
  --role contributor \
  --scopes /subscriptions/<YOUR_SUBSCRIPTION_ID>/resourceGroups/togetherlearn-rg \
  --sdk-auth
```

Copy the entire JSON output — it looks like this:

```json
{
  "clientId": "...",
  "clientSecret": "...",
  "subscriptionId": "...",
  "tenantId": "...",
  ...
}
```

### Step 2 — Add GitHub Secrets

Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret Name | Value |
|---|---|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `AZURE_CREDENTIALS` | The full JSON from the service principal above |
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com/api` |

### Step 3 — Push to Trigger Deployment

Any push to the `deploy/azure-aks` branch triggers `.github/workflows/deploy-azure.yml`:

```bash
git checkout deploy/azure-aks
git push origin deploy/azure-aks
```

The pipeline:
1. Builds all 10 Spring Boot services with Maven (parallel matrix — runs in ~8 min)
2. Builds the Next.js frontend Docker image
3. Pushes all images to Docker Hub tagged with the Git SHA
4. Connects to AKS using the Azure service principal
5. Applies all `k8s/` manifests (namespace → secrets → configmaps → storage → stateful → monitoring → deployments → HPA → ingress)
6. Waits for each database StatefulSet to be ready
7. Rolls out new images to all 11 deployments
8. Waits for all rollouts to complete (5 min timeout per service)

Watch it live in the **Actions** tab of your GitHub repo.

---

## Part 5 — First Manual Deploy

Before the CI/CD pipeline runs, you need to deploy once manually from your machine (with kubectl configured):

```bash
# Apply Azure-specific storage class first
kubectl apply -f k8s/azure/storage-class.yaml

# Apply everything else in order
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/stateful/
kubectl apply -f k8s/monitoring/
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/hpa/
kubectl apply -f k8s/ingress/
```

Watch pods come up:

```bash
kubectl get pods -n togetherlearn --watch
```

All pods should reach `Running` — this takes 5–10 minutes as PostgreSQL, Redis, and RabbitMQ initialize before the application services start.

---

## Verifying the Deployment

```bash
# All pods running
kubectl get pods -n togetherlearn

# All 10 services registered with Eureka
kubectl port-forward svc/discovery-server 8761:8761 -n togetherlearn
# Open http://localhost:8761 in your browser

# Check ingress has an address
kubectl get ingress -n togetherlearn

# Check TLS certificate was issued
kubectl describe certificate tl-tls -n togetherlearn
# Status should show: Certificate is up to date and has not expired
```

Open `https://app.yourdomain.com` — the TogetherLearn login page should load over HTTPS.

---

## Managing the Cluster

### View logs
```bash
kubectl logs -n togetherlearn deployment/user-service --tail=100 -f
```

### Scale down to save credits
```bash
# Scale all app services to 1 replica (saves ~50% cost)
for svc in api-gateway user-service course-service group-service qa-service peer-teaching-service notification-service chat-service file-service frontend; do
  kubectl scale deployment $svc --replicas=1 -n togetherlearn
done
```

### Scale the node pool down when not in use
```bash
az aks nodepool scale \
  --resource-group togetherlearn-rg \
  --cluster-name togetherlearn-aks \
  --name nodepool1 \
  --node-count 1
```

### Delete the cluster (stop all charges)
```bash
az aks delete \
  --resource-group togetherlearn-rg \
  --name togetherlearn-aks \
  --yes --no-wait
```

### Recreate the cluster later
Just re-run the `az aks create` command from Step 3. The persistent volumes (Azure Disk) survive cluster deletion if you used `reclaimPolicy: Retain` in the StorageClass.

---

## Architecture on Azure

```
User browser
     │
     ▼
Azure Load Balancer (public IP — free with AKS)
     │
     ▼
nginx Ingress Controller (in ingress-nginx namespace)
     │  (TLS terminated by cert-manager + Let's Encrypt)
     ├── app.yourdomain.com → frontend:3000
     └── api.yourdomain.com → api-gateway:8080
                                    │
                              togetherlearn namespace
                                    │
          ┌─────────────────────────┼────────────────────────┐
          │                         │                         │
    App services              Infrastructure            Monitoring
    (10 Deployments           (StatefulSets)            (Deployments)
    + HPA autoscaling)        - 7× PostgreSQL           - Prometheus
    - discovery-server        - Redis                   - Grafana
    - api-gateway             - RabbitMQ                - Zipkin
    - user-service            - MinIO                   - Elasticsearch
    - course-service                                    - Logstash
    - group-service                                     - Kibana
    - qa-service
    - peer-teaching-service
    - notification-service
    - chat-service
    - file-service
    - frontend
          │
          ▼
    Azure Disk (managed-csi)
    Persistent volumes for
    all stateful workloads
```

---

## Troubleshooting

**Pod stuck in `Pending`:**
```bash
kubectl describe pod <pod-name> -n togetherlearn
# Look for: "0/2 nodes are available" → nodes need more resources
# Fix: scale up node pool or reduce resource requests in deployments
```

**ImagePullBackOff:**
```bash
# Docker Hub image not found — check the image name and tag
kubectl describe pod <pod-name> -n togetherlearn | grep Image
# Verify the image exists on Docker Hub
```

**TLS certificate stuck in `Pending`:**
```bash
kubectl describe certificaterequest -n togetherlearn
# DNS must point to the ingress IP before cert-manager can issue
# Check your DNS propagation at dnschecker.org
```

**Services not registering with Eureka:**
```bash
# Check discovery-server is up first
kubectl logs deployment/discovery-server -n togetherlearn
# Then check a service that won't register
kubectl logs deployment/user-service -n togetherlearn | grep -i eureka
```
