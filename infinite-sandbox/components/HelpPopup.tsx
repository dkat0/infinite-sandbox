"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface HelpPopupProps {
  isOpen: boolean
  onClose: () => void
}

export default function HelpPopup({ isOpen, onClose }: HelpPopupProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white/80 dark:bg-[#1A2A3A]/90 backdrop-blur-md rounded-lg border border-[#B8D1E5] dark:border-[#5A7A99]">
        <DialogHeader>
          <DialogTitle className="text-2xl tracking-[0.15em] uppercase text-[#2B4C6F] dark:text-white">
            System Guide
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-[#5A7A99] dark:text-white/70 tracking-wider space-y-4">
          <p className="uppercase">Welcome to the Infinite Sandbox System</p>
          <div className="space-y-2">
            <p className="flex items-center space-x-2">
              <span className="text-[#2B4C6F] dark:text-white/90">Initialize your journey with a prompt</span>
            </p>
            <p className="text-sm italic pl-6">Try these ideas:</p>
            <ul className="space-y-1 pl-8 text-sm">
              <li>• Sci-Fi: "A colony ship discovers an abandoned alien megastructure"</li>
              <li>• Murder Mystery: "A detective investigates a locked-room murder in a smart home"</li>
              <li>• Fantasy: "A young mage's first day at a magical university goes awry"</li>
              <li>• Modern Day Thriller: "A journalist uncovers a conspiracy involving AI-generated deepfakes"</li>
            </ul>
          </div>
          <p className="uppercase text-[#2B4C6F]/70 dark:text-white/50">System ready for initialization...</p>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  )
}