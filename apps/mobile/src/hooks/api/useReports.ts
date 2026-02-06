import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { getErrorMessage } from '../../utils/errorHandler';

interface CreateReportRequest {
  targetType: 'user' | 'answer';
  targetId: string;
  reason: string;
  details?: string;
}

interface CreateReportResponse {
  message: string;
  reportId: string;
}

export const REPORT_REASONS = [
  { value: 'spam', label: 'スパム' },
  { value: 'harassment', label: '嫌がらせ・いじめ' },
  { value: 'hate_speech', label: 'ヘイトスピーチ' },
  { value: 'inappropriate_content', label: '不適切なコンテンツ' },
  { value: 'impersonation', label: 'なりすまし' },
  { value: 'personal_info', label: '個人情報の公開' },
  { value: 'other', label: 'その他' },
] as const;

export type ReportReason = typeof REPORT_REASONS[number]['value'];

export function useCreateReport() {
  return useMutation({
    mutationFn: async (data: CreateReportRequest) => {
      const response = await apiClient.post<CreateReportResponse>('/reports', data);
      return response.data;
    },
    onError: (error) => {
      console.error('Create report error:', getErrorMessage(error));
    },
  });
}
