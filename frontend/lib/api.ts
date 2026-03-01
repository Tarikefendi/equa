const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  // Auth
  async register(email: string, username: string, password: string, captchaToken?: string | null, deviceFingerprint?: string | null) {
    const body: any = { email, username, password };
    if (captchaToken) {
      body.captchaToken = captchaToken;
    }
    if (deviceFingerprint) {
      body.deviceFingerprint = deviceFingerprint;
    }
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async login(email: string, password: string, captchaToken?: string | null, deviceFingerprint?: string | null) {
    const body: any = { email, password };
    if (captchaToken) {
      body.captchaToken = captchaToken;
    }
    if (deviceFingerprint) {
      body.deviceFingerprint = deviceFingerprint;
    }
    const response: any = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (response.data?.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async getProfile() {
    return this.request('/auth/profile', {
      method: 'GET',
    });
  }

  // Campaigns
  async getCampaigns(filters?: { 
    status?: string; 
    category?: string; 
    search?: string;
    target_type?: string;
    date_from?: string;
    date_to?: string;
    min_signatures?: number;
    max_signatures?: number;
    sort_by?: string;
    sort_order?: string;
    limit?: number;
    offset?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    return this.request(`/campaigns?${params}`);
  }

  async getCampaignById(id: string) {
    return this.request(`/campaigns/${id}`);
  }

  async createCampaign(data: any, deviceFingerprint?: string | null) {
    const body = { ...data };
    if (deviceFingerprint) {
      body.deviceFingerprint = deviceFingerprint;
    }
    return this.request('/campaigns', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updateCampaign(id: string, data: any) {
    return this.request(`/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getMyCampaigns() {
    return this.request('/campaigns/my');
  }

  // Signatures
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', {
      method: 'PUT',
    });
  }

  // Reports
  async reportCampaign(campaignId: string, reason: string, details: string) {
    return this.request('/reports', {
      method: 'POST',
      body: JSON.stringify({
        entity_type: 'campaign',
        entity_id: campaignId,
        reason,
        details,
      }),
    });
  }

  // Uploads
  async uploadFile(file: File, entityType: string, entityId: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_type', entityType);
    formData.append('entity_id', entityId);

    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}/uploads/file`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }

    return data;
  }

  async getUploads(entityType: string, entityId: string) {
    return this.request(`/uploads/entity/${entityType}/${entityId}`);
  }

  // Signatures
  async addSignature(campaignId: string, message?: string, isAnonymous?: boolean, deviceFingerprint?: string | null) {
    const body: any = {
      campaign_id: campaignId,
      message,
      is_anonymous: isAnonymous,
    };
    if (deviceFingerprint) {
      body.deviceFingerprint = deviceFingerprint;
    }
    return this.request('/signatures', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async removeSignature(campaignId: string) {
    return this.request(`/signatures/campaign/${campaignId}`, {
      method: 'DELETE',
    });
  }

  async getCampaignSignatures(campaignId: string) {
    return this.request(`/signatures/campaign/${campaignId}`);
  }

  async getSignatureCount(campaignId: string) {
    return this.request(`/signatures/campaign/${campaignId}/count`);
  }

  async getUserSignature(campaignId: string) {
    return this.request(`/signatures/campaign/${campaignId}/my-signature`);
  }

  async getMySignatures() {
    return this.request('/signatures/my-signatures');
  }

  // Organization responses
  async sendToOrganization(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/send-to-organization`, {
      method: 'POST',
    });
  }

  // Generate press release
  async generatePressRelease(campaignId: string) {
    return this.request(`/press-release/campaign/${campaignId}`);
  }

  // Get email history
  async getEmailHistory(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/email-history`);
  }

  // Organization responses
  async createOrganizationResponse(data: {
    campaign_id: string;
    organization_name: string;
    organization_email: string;
    response_text: string;
    response_type: string;
    contact_person?: string;
  }) {
    return this.request('/organization-responses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCampaignResponses(campaignId: string) {
    return this.request(`/organization-responses/campaign/${campaignId}`);
  }

  // Campaign status updates
  async createStatusUpdate(campaignId: string, data: {
    statusType: string;
    title: string;
    description?: string;
    documents?: any;
    isMilestone?: boolean;
  }) {
    return this.request(`/campaign-status/campaign/${campaignId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getStatusUpdates(campaignId: string) {
    return this.request(`/campaign-status/campaign/${campaignId}`);
  }

  async deleteStatusUpdate(updateId: string) {
    return this.request(`/campaign-status/${updateId}`, {
      method: 'DELETE',
    });
  }

  // Email verification
  async resendVerification() {
    return this.request('/auth/resend-verification', {
      method: 'POST',
    });
  }

  async verifyEmail(token: string) {
    return this.request(`/auth/verify-email?token=${token}`);
  }

  // Admin
  async getAdminDashboardStats() {
    return this.request('/admin/dashboard/stats');
  }

  async getAdminActivity(limit?: number) {
    const params = limit ? `?limit=${limit}` : '';
    return this.request(`/admin/dashboard/activity${params}`);
  }

  async getAdminUsers(filters?: { role?: string; verified?: boolean; limit?: number; offset?: number }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    return this.request(`/admin/users?${params}`);
  }

  async updateUserRole(userId: string, role: string) {
    return this.request(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async banUser(userId: string, reason: string) {
    return this.request(`/admin/users/${userId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getPendingCampaigns(limit?: number) {
    const params = limit ? `?limit=${limit}` : '';
    return this.request(`/admin/campaigns/pending${params}`);
  }

  async approveCampaign(campaignId: string) {
    return this.request(`/admin/campaigns/${campaignId}/approve`, {
      method: 'POST',
    });
  }

  async rejectCampaign(campaignId: string, reason: string) {
    return this.request(`/admin/campaigns/${campaignId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async deleteCampaignAdmin(campaignId: string) {
    return this.request(`/admin/campaigns/${campaignId}`, {
      method: 'DELETE',
    });
  }

  async getPendingReports(limit?: number) {
    const params = limit ? `?limit=${limit}` : '';
    return this.request(`/admin/reports/pending${params}`);
  }

  async updateReportStatus(reportId: string, status: string, resolution?: string) {
    return this.request(`/admin/reports/${reportId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, resolution }),
    });
  }

}

export const api = new ApiClient(API_URL);