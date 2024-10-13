import { copy } from "@/lib/copy";
import { toast } from "sonner";

export const logToast = {
  log(title: string, description: string = "") {
    console.log(title, description);
    toast(title, { description });
  },
  success(title: string, description: string = "") {
    console.log(title, description);
    toast.success(title, { description });
  },
  error(title: string, description: string = "") {
    console.error(title, description);
    toast.error(title, {
      description,
      action: {
        label: "Copy",
        onClick: () =>
          copy(description).then((success: boolean) => {
            if (success) {
              logToast.success("Copied");
            } else {
              logToast.error("Copy failed");
            }
          }),
      },
    });
  },
};
