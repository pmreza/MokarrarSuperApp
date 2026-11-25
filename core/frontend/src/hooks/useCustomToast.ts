import { toast } from "sonner"

const useCustomToast = () => {
  const showSuccessToast = (description: string) => {
    toast.success("عملیات موفق", {
      description,
    })
  }

  const showErrorToast = (description: string) => {
    toast.error("خطای سامانه", {
      description,
    })
  }

  return { showSuccessToast, showErrorToast }
}

export default useCustomToast
