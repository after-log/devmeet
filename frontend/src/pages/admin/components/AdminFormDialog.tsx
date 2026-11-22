import { useEffect, type ReactNode, type RefObject } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { AdminSurface, IconButton } from './AdminUI';

export default function AdminFormDialog({
  title,
  description,
  busy,
  heading,
  close,
  restoreFocus,
  children,
}: {
  title: string;
  description: string;
  busy: boolean;
  heading: RefObject<HTMLHeadingElement | null>;
  close: () => void;
  restoreFocus: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    heading.current?.focus();
  }, [title, heading]);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-60 bg-[#17171770] backdrop-blur-sm" />
        <Dialog.Content
          aria-busy={busy}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            heading.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreFocus();
          }}
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (busy) event.preventDefault();
          }}
          className="fixed top-1/2 left-1/2 z-61 max-h-[90dvh] w-[calc(100%-32px)] max-w-170 -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[15px] bg-white shadow-[0_24px_100px_#17171730]"
        >
          <AdminSurface>
            <header className="flex items-start justify-between gap-4 border-b border-neutral-100 p-6 max-sm:p-5">
              <div>
                <Dialog.Title
                  ref={heading}
                  tabIndex={-1}
                  className="text-lg font-semibold outline-none"
                >
                  {title}
                </Dialog.Title>
                <Dialog.Description className="mt-1! text-sm text-neutral-500">
                  {description}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <IconButton aria-label="닫기" disabled={busy}>
                  <X size={18} />
                </IconButton>
              </Dialog.Close>
            </header>
            {children}
          </AdminSurface>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
