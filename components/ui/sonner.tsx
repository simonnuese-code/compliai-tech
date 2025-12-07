"use client"

import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-950 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-xl group-[.toaster]:p-6 group-[.toaster]:gap-4",
          description: "group-[.toast]:text-slate-500 group-[.toast]:text-base group-[.toast]:leading-relaxed",
          actionButton:
            "group-[.toast]:bg-slate-900 group-[.toast]:text-slate-50",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500",
          title: "group-[.toast]:text-lg group-[.toast]:font-bold group-[.toast]:mb-1",
          icon: "group-[.toast]:text-cyan-500 group-[.toast]:w-6 group-[.toast]:h-6",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
