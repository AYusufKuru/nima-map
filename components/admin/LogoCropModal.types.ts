export type LogoCropModalProps = {
  visible: boolean;
  imageSrc: string | null;
  onCancel: () => void;
  onApply: (blob: Blob, mime: string) => void | Promise<void>;
};
