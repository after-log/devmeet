import { Toaster as Sonner, type ToasterProps } from 'sonner';

export const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="dark"
    position="top-center"
    offset={16}
    mobileOffset={16}
    duration={2600}
    toastOptions={{ classNames: { toast: 'font-sans', title: 'font-normal' } }}
    {...props}
  />
);
