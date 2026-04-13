"use client";

import { Button } from "@/components/ui/Button";

type Props = {
  loading: boolean;
  disabled?: boolean;
  onClick: () => void;
  children?: string;
};

export function GenerateButton({ loading, disabled, onClick, children = "사진 꾸미기 시작" }: Props) {
  return (
    <Button variant="gradient" loading={loading} disabled={disabled} onClick={onClick}>
      {children}
    </Button>
  );
}
