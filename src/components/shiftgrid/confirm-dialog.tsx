'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle, Loader2 } from 'lucide-react'

type ConfirmVariant = 'danger' | 'success' | 'warning' | 'info'

const variantConfig = {
  danger: {
    icon: <AlertTriangle className="size-6 text-rose-600" />,
    iconBg: 'bg-rose-100 dark:bg-rose-950/40',
    button: 'bg-rose-600 hover:bg-rose-700 text-white',
    border: 'border-rose-200 dark:border-rose-900',
  },
  success: {
    icon: <CheckCircle2 className="size-6 text-emerald-600" />,
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/40',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    border: 'border-emerald-200 dark:border-emerald-900',
  },
  warning: {
    icon: <AlertTriangle className="size-6 text-amber-600" />,
    iconBg: 'bg-amber-100 dark:bg-amber-950/40',
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
    border: 'border-amber-200 dark:border-amber-900',
  },
  info: {
    icon: <Info className="size-6 text-blue-600" />,
    iconBg: 'bg-blue-100 dark:bg-blue-950/40',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    border: 'border-blue-200 dark:border-blue-900',
  },
}

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  requireCheckbox?: boolean
  checkboxLabel?: string
  onConfirm: () => Promise<void> | void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  requireCheckbox = false,
  checkboxLabel = 'I confirm this action',
  onConfirm,
}: ConfirmDialogProps) {
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(false)

  const config = variantConfig[variant]

  async function handleConfirm() {
    if (requireCheckbox && !checked) return
    setLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
      setChecked(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setChecked(false) }}>
      <DialogContent className={`max-w-md border-2 ${config.border}`}>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={`size-12 rounded-full flex items-center justify-center shrink-0 ${config.iconBg}`}>
              {config.icon}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg">{title}</DialogTitle>
              <DialogDescription className="mt-1 text-sm">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {requireCheckbox && (
          <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2 bg-muted/50">
            <Checkbox checked={checked} onCheckedChange={(v) => setChecked(v === true)} />
            <span className="text-sm font-medium">{checkboxLabel}</span>
          </label>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || (requireCheckbox && !checked)}
            className={config.button}
          >
            {loading ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
