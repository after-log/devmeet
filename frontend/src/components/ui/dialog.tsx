import type { ComponentProps } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

// shadcn/ui Radix Dialog, styled for the existing devmeet theme.
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

export const DialogOverlay = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Overlay>) => (
  <DialogPrimitive.Overlay
    data-slot="dialog-overlay"
    className={cn('fixed inset-0 z-50 bg-[#0d0f14bb] backdrop-blur-[4px]', className)}
    {...props}
  />
);

export const DialogContent = ({
  className,
  children,
  showCloseButton = true,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { showCloseButton?: boolean }) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      data-slot="dialog-content"
      className={cn(
        'fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[410px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[9px] border border-[#484c55] bg-surface p-[25px] text-[#dfe1e5] shadow-lg outline-none',
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogClose
          className="absolute top-3 right-3 rounded-md p-2 text-[#a1a9b6] hover:bg-lift"
          aria-label="닫기"
        >
          <X className="size-4" />
        </DialogClose>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
);

export const DialogHeader = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    data-slot="dialog-header"
    className={cn('flex flex-col gap-2 text-left', className)}
    {...props}
  />
);
export const DialogFooter = ({ className, ...props }: ComponentProps<'div'>) => (
  <div data-slot="dialog-footer" className={cn('flex flex-col gap-2', className)} {...props} />
);
export const DialogTitle = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title
    data-slot="dialog-title"
    className={cn('pr-5 text-[23px] leading-[1.45] font-semibold', className)}
    {...props}
  />
);
export const DialogDescription = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description
    data-slot="dialog-description"
    className={cn('text-[14px] leading-[1.8] text-[#969eab]', className)}
    {...props}
  />
);
