"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface QuitConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function QuitConfirmation({ isOpen, onClose, onConfirm }: QuitConfirmationProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-sky-50 text-sky-900 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-sky-700">Are you sure you want to quit?</DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-sky-800">
          Your journey through the Infinite Ocean will end here. Are you sure you want to return to shore?
        </DialogDescription>
        <DialogFooter>
          <Button onClick={onClose} variant="outline" className="border-sky-300 text-sky-700 hover:bg-sky-100">
            Continue Journey
          </Button>
          <Button onClick={onConfirm} variant="destructive" className="bg-red-400 hover:bg-red-500 text-white">
            Return to Shore
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

