"use client";
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import clsx from "clsx";

export function Modal({ open, onClose, title, children, panelClassName, titleClassName }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; panelClassName?: string; titleClassName?: string }) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={clsx("w-full max-w-lg rounded-lg border border-token surface p-4 shadow-lg", panelClassName)}>
                <Dialog.Title className={clsx("text-lg font-semibold mb-2", titleClassName)}>{title}</Dialog.Title>
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}


