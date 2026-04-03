/**
 * API 에러 응답에서 안전하게 문자열 메시지를 추출합니다.
 * err.response.data.error가 object일 때도 React #31 에러 없이 처리합니다.
 */
export function getErrorMessage(err, fallback = '오류가 발생했습니다') {
  const data = err?.response?.data;
  if (typeof data?.error === 'string') return data.error;
  if (typeof data?.error === 'object') return data.error.message || JSON.stringify(data.error);
  if (typeof data?.message === 'string') return data.message;
  if (typeof err?.message === 'string' && err.message !== 'Network Error') return err.message;
  if (err?.code === 'ECONNABORTED') return '서버 응답 시간이 초과되었습니다';
  if (err?.message === 'Network Error') return '네트워크 연결을 확인해주세요';
  return fallback;
}
