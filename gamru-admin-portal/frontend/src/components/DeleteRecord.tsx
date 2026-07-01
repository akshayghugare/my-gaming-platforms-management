import { toast } from 'react-toastify';
import apiService from '@/services/api';

interface ConfirmDeleteOptions {
  endpoint: string;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
}

export const DeleteRecord = ({
  endpoint,
  successMessage = 'Deleted successfully',
  errorMessage = 'Delete failed',
  onSuccess,
}: ConfirmDeleteOptions): void => {
  toast.info(
    ({ closeToast }) => (
      <div>
        <div>Are you sure you want to delete this record?</div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button
            onClick={async () => {
              try {
                await apiService.delete(endpoint);
                toast.success(successMessage);
                onSuccess?.();
              } catch {
                toast.error(errorMessage);
              }
              closeToast?.();
            }}
            style={{
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            Yes
          </button>

          <button
            onClick={() => {
              toast.info('Delete cancelled');
              closeToast?.();
            }}
            style={{
              background: '#6b7280',
              color: '#fff',
              border: 'none',
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            No
          </button>
        </div>
      </div>
    ),
    {
      autoClose: false,
      closeOnClick: false,
    }
  );
};
