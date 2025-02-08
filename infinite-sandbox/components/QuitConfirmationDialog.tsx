import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface QuitConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function QuitConfirmationDialog({ isOpen, onClose, onConfirm }: QuitConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-white dark:bg-[#1A2A3A] border border-[#B8D1E5] dark:border-[#5A7A99]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[#2B4C6F] dark:text-white">
            Are you sure you want to end this story?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#5A7A99] dark:text-white/70">
            This action will end your current story and return you to the home page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onClose}
            className="bg-[#E6EEF5] dark:bg-[#2B4C6F] text-[#2B4C6F] dark:text-white hover:bg-[#D1E0ED] dark:hover:bg-[#3A5D80]"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-[#2B4C6F] dark:bg-white text-white dark:text-[#2B4C6F] hover:bg-[#3A5D80] dark:hover:bg-[#E6EEF5]"
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

