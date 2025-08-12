'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteConfirmationModal({
  staffId,
  fullName,
}: {
  staffId: number;
  fullName: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = async () => {
    startTransition(async () => {
      const res = await fetch('/api/staff/delete', {
        method: 'POST',
        body: JSON.stringify({ staffId }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        setOpen(false);
        router.refresh(); // Refresh page to remove row
      } else {
        alert('Failed to delete');
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="text-red-600 hover:underline font-medium">Delete</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed z-50 bg-white p-6 rounded-md shadow-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm">
          <Dialog.Title className="text-lg font-semibold text-gray-800 mb-2">
            Confirm Deletion
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-600 mb-4">
            Are you sure you want to delete <span className="font-medium text-black">{fullName}</span>? This action cannot be undone.
          </Dialog.Description>
          <div className="flex justify-end gap-3 mt-4">
            <Dialog.Close asChild>
              <button className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
