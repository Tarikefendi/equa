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
    // Always read token fresh from localStorage to handle post-login state
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }

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
    return this.request('/auth/profile', { method: 'GET' });
  }

  async updateProfile(data: { is_public?: boolean }) {
    return this.request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getReputationEvents() {
    return this.request('/auth/reputation/events', { method: 'GET' });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
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

  async recordCampaignView(id: string) {
    return this.request(`/campaigns/${id}/view`, { method: 'POST' });
  }

  async getTrendingCampaigns() {
    return this.request('/campaigns/trending');
  }

  async searchCampaigns(query: string, sort: string = 'relevant') {
    return this.request(`/campaigns/search?q=${encodeURIComponent(query)}&sort=${sort}`);
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
    return this.request('/campaigns/my/campaigns');
  }

  async getMySignatures() {
    return this.request('/signatures/my-signatures');
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

  // Campaign updates
  async getCampaignUpdates(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/updates`);
  }

  async addCampaignUpdate(campaignId: string, content: string, title?: string, source_url?: string) {
    return this.request(`/campaigns/${campaignId}/updates`, {
      method: 'POST',
      body: JSON.stringify({ content, title, source_url }),
    });
  }

  async addOfficialResponse(campaignId: string, content: string, title?: string, source_url?: string) {
    return this.request(`/campaigns/${campaignId}/updates/official-response`, {
      method: 'POST',
      body: JSON.stringify({ content, title, source_url }),
    });
  }

  async editCampaignUpdate(campaignId: string, updateId: number, content: string, title?: string, source_url?: string, reason?: string) {
    return this.request(`/campaigns/${campaignId}/updates/${updateId}`, {
      method: 'PUT',
      body: JSON.stringify({ content, title, source_url, reason }),
    });
  }

  async getCampaignUpdateHistory(campaignId: string, updateId: number) {
    return this.request(`/campaigns/${campaignId}/updates/${updateId}/history`);
  }

  async deleteCampaignUpdate(campaignId: string, updateId: number) {
    return this.request(`/campaigns/${campaignId}/updates/${updateId}`, {
      method: 'DELETE',
    });
  }

  // Entities
  async searchEntities(query: string) {
    return this.request(`/entities/search?q=${encodeURIComponent(query)}`);
  }

  async getEntityBySlug(slug: string) {
    return this.request(`/entities/${slug}`);
  }

  async getMostActiveEntities() {
    return this.request('/entities/most-active');
  }

  async getCampaignEvidence(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/evidence`);
  }

  async getPendingEvidence(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/evidence/pending`);
  }

  async addCampaignEvidence(campaignId: string, data: { type: string; title: string; description?: string; url?: string; credibility_type?: string }) {
    return this.request(`/campaigns/${campaignId}/evidence`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEvidenceStatus(campaignId: string, evidenceId: string, status: 'approved' | 'rejected') {
    return this.request(`/campaigns/${campaignId}/evidence/${evidenceId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteCampaignEvidence(campaignId: string, evidenceId: string) {
    return this.request(`/campaigns/${campaignId}/evidence/${evidenceId}`, { method: 'DELETE' });
  }

  async createEntity(data: { name: string; type?: string; description?: string; website?: string; country?: string }) {
    return this.request('/entities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEntityFollowStatus(slug: string) {
    return this.request(`/entities/${slug}/follow`);
  }

  async getEntityMetrics(slug: string) {
    return this.request(`/entities/${slug}/metrics`);
  }

  async followEntity(slug: string) {
    return this.request(`/entities/${slug}/follow`, { method: 'POST' });
  }

  async unfollowEntity(slug: string) {
    return this.request(`/entities/${slug}/follow`, { method: 'DELETE' });
  }

  async updateCampaignStatus(campaignId: string, status: string, description?: string) {
    return this.request(`/campaigns/${campaignId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, description }),
    });
  }

  async getCampaignStatusHistory(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/status-history`);
  }

  async getSimilarCampaigns(query: string) {
    return this.request(`/campaigns/similar?query=${encodeURIComponent(query)}`);
  }

  async recordCampaignShare(campaignId: string, platform: string) {
    return this.request(`/campaigns/${campaignId}/share`, {
      method: 'POST',
      body: JSON.stringify({ platform }),
    });
  }

  async getCampaignShareStats(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/share-stats`);
  }

  async resolveCampaign(campaignId: string, reason?: string) {
    return this.request(`/campaigns/${campaignId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async closeCampaign(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/close`, {
      method: 'POST',
    });
  }

  async getCampaignImpact(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/impact`);
  }

  async getEvidenceSummary(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/evidence-summary`);
  }

  async approveEvidence(evidenceId: string) {
    return this.request(`/campaigns/evidence/${evidenceId}/approve`, { method: 'POST' });
  }

  async rejectEvidence(evidenceId: string) {
    return this.request(`/campaigns/evidence/${evidenceId}/reject`, { method: 'POST' });
  }

  async flagEvidence(evidenceId: string) {
    return this.request(`/campaigns/evidence/${evidenceId}/flag`, { method: 'POST' });
  }

  async getFlaggedEvidence() {
    return this.request('/admin/flagged-evidence');
  }

  // Standards Library
  async getStandardCategories() {
    return this.request('/standards/categories');
  }

  async getStandards(categoryId?: number) {
    const params = categoryId ? `?category_id=${categoryId}` : '';
    return this.request(`/standards${params}`);
  }

  async suggestStandard(data: { title: string; description?: string; category_id?: number; source_url?: string }) {
    return this.request('/standards/suggest', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getStandardSuggestions(status?: string) {
    const params = status ? `?status=${status}` : '';
    return this.request(`/admin/standard-suggestions${params}`);
  }

  async reviewStandardSuggestion(id: number, status: 'approved' | 'rejected') {
    return this.request(`/admin/standard-suggestions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async submitCampaignReport(campaignId: string, reason: string, description?: string) {
    return this.request(`/campaigns/${campaignId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, description }),
    });
  }

  async getUserCampaignReport(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/report`);
  }

  async getCampaignReports() {
    return this.request('/admin/campaign-reports');
  }

  async updateCampaignReportStatus(reportId: string, status: string) {
    return this.request(`/admin/campaign-reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getFollowStatus(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/follow`);
  }

  async followCampaign(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/follow`, { method: 'POST' });
  }

  async unfollowCampaign(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/follow`, { method: 'DELETE' });
  }

  async togglePinCampaignUpdate(campaignId: string, updateId: number) {
    return this.request(`/campaigns/${campaignId}/updates/${updateId}/pin`, {
      method: 'PATCH',
    });
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

  async getPendingLawyers() {
    return this.request('/admin/lawyers/pending');
  }

  async verifyLawyer(lawyerId: string) {
    return this.request(`/admin/lawyers/${lawyerId}/verify`, { method: 'POST' });
  }

  async rejectLawyer(lawyerId: string) {
    return this.request(`/admin/lawyers/${lawyerId}/reject`, { method: 'POST' });
  }

  async getAdminEntities() {
    return this.request('/admin/entities');
  }

  async verifyEntity(entityId: string) {
    return this.request(`/admin/entities/${entityId}/verify`, { method: 'POST' });
  }

  async unverifyEntity(entityId: string) {
    return this.request(`/admin/entities/${entityId}/unverify`, { method: 'POST' });
  }

  async getVoteStats(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/votes`);
  }

  async castVote(campaignId: string, choice: string) {
    return this.request(`/campaigns/${campaignId}/votes`, { method: 'POST', body: JSON.stringify({ choice }) });
  }

  async getComments(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/comments`);
  }

  async createComment(campaignId: string, content: string) {
    return this.request(`/campaigns/${campaignId}/comments`, { method: 'POST', body: JSON.stringify({ content }) });
  }

  async isFollowingCampaign(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/follow`);
  }

  async getFollowerCount(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/follow`);
  }

  async updateReportStatus(reportId: string, status: string, resolution?: string) {
    return this.request(`/admin/reports/${reportId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, resolution }),
    });
  }

  async getCampaignVictory(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/victory`);
  }

  async getCampaignMomentum(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/momentum`);
  }

  async getCampaignMilestone(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/milestone`);
  }

  // Investigation Mode
  async toggleInvestigationMode(campaignId: string, enabled: boolean) {    return this.request(`/campaigns/${campaignId}/investigation-mode`, {
      method: 'PATCH',
      body: JSON.stringify({ investigation_mode: enabled }),
    });
  }

  async getInvestigationSummary(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/investigation-summary`);
  }

  // Transparency Score
  async getEntityTransparencyScore(slug: string) {
    return this.request(`/entities/${slug}/transparency-score`);
  }

  // Lawyer Marketplace
  async getCampaignLegalStatus(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/legal-status`);
  }

  async requestLegalSupport(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/legal-request`, { method: 'POST' });
  }

  async getOpenLegalRequests() {
    return this.request('/legal-requests');
  }

  async applyToLegalRequest(requestId: string) {
    return this.request(`/legal-requests/${requestId}/apply`, { method: 'POST' });
  }

  async registerAsLawyer(data: { full_name: string; expertise: string; bar_number?: string; city?: string; bio?: string }) {
    return this.request('/lawyers/register', { method: 'POST', body: JSON.stringify(data) });
  }

  async getMyLawyerProfile() {
    return this.request('/lawyers/me');
  }


}

export const api = new ApiClient(API_URL);
