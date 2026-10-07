import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      richColors
      closeButton
      position="bottom-right"
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast font-sans group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl group-[.toaster]:border group-[.toaster]:p-4",
          title: "font-semibold text-sm leading-tight",
          description: "text-xs mt-1 leading-normal opacity-90",
          actionButton: "font-medium text-xs rounded-lg",
          cancelButton: "font-medium text-xs rounded-lg",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
