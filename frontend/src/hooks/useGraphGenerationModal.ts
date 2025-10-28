import { useState, useCallback } from "react";

interface GraphGenerationModalState {
  isOpen: boolean;
  messageId: string | null;
  chatId: string | null;
}

export const useGraphGenerationModal = () => {
  const [modalState, setModalState] = useState<GraphGenerationModalState>({
    isOpen: false,
    messageId: null,
    chatId: null,
  });

  const openModal = useCallback((messageId: string, chatId: string) => {setModalState({
      isOpen: true,
      messageId,
      chatId,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      messageId: null,
      chatId: null,
    });
  }, []);

  const isModalOpen = modalState.isOpen;

  return {
    modalState,
    openModal,
    closeModal,
    isModalOpen,
  };
};
