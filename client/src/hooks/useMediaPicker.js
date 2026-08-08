import { useCallback, useState } from "react";

export default function useMediaPicker() {
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const openMediaPicker = useCallback(() => {
    setIsMediaPickerOpen(true);
  }, []);

  const closeMediaPicker = useCallback(() => {
    setIsMediaPickerOpen(false);
  }, []);

  return {
    isMediaPickerOpen,
    openMediaPicker,
    closeMediaPicker,
  };
}
