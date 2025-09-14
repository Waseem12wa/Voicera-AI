import requests
import hmac
import hashlib
import json
from typing import Dict, List, Optional, Any
from datetime import datetime

class VoiceraError(Exception):
    """Custom exception for Voicera AI SDK errors"""
    def __init__(self, message: str, status_code: int = 0, data: Dict = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.data = data or {}

class VoiceraSDK:
    """
    Voicera AI SDK for Python
    Official SDK for integrating with Voicera AI platform
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.base_url = config.get('base_url', 'https://api.voicera.ai')
        self.api_key = config.get('api_key')
        self.access_token = config.get('access_token')
        self.version = config.get('version', 'v1')
        self.timeout = config.get('timeout', 30)
        
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'VoiceraAI-PythonSDK/1.0.0'
        })
        
        if self.access_token:
            self.session.headers['Authorization'] = f'Bearer {self.access_token}'
        elif self.api_key:
            self.session.headers['X-API-Key'] = self.api_key
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/{self.version}{endpoint}"
        
        try:
            response = self.session.request(
                method, 
                url, 
                timeout=self.timeout,
                **kwargs
            )
            
            if response.status_code >= 400:
                error_data = response.json() if response.content else {}
                raise VoiceraError(
                    error_data.get('message', 'API request failed'),
                    response.status_code,
                    error_data
                )
            
            return response.json() if response.content else {}
            
        except requests.exceptions.RequestException as e:
            raise VoiceraError(f"Network error: {str(e)}")
    
    # Authentication methods
    def authenticate(self, client_id: str, client_secret: str, scope: str = "read write") -> Dict:
        """Authenticate with OAuth 2.0 client credentials flow"""
        data = {
            'grant_type': 'client_credentials',
            'client_id': client_id,
            'client_secret': client_secret,
            'scope': scope
        }
        
        response = self._make_request('POST', '/oauth/token', json=data)
        self.access_token = response['access_token']
        self.session.headers['Authorization'] = f'Bearer {self.access_token}'
        return response
    
    # User management
    def get_users(self, filters: Dict = None) -> List[Dict]:
        """Get list of users"""
        params = filters or {}
        response = self._make_request('GET', '/users', params=params)
        return response.get('data', [])
    
    def get_user(self, user_id: str) -> Dict:
        """Get specific user by ID"""
        response = self._make_request('GET', f'/users/{user_id}')
        return response
    
    def create_user(self, user_data: Dict) -> Dict:
        """Create new user"""
        response = self._make_request('POST', '/users', json=user_data)
        return response
    
    def update_user(self, user_id: str, user_data: Dict) -> Dict:
        """Update existing user"""
        response = self._make_request('PUT', f'/users/{user_id}', json=user_data)
        return response
    
    def delete_user(self, user_id: str) -> Dict:
        """Delete user"""
        response = self._make_request('DELETE', f'/users/{user_id}')
        return response
    
    # Course management
    def get_courses(self, filters: Dict = None) -> List[Dict]:
        """Get list of courses"""
        params = filters or {}
        response = self._make_request('GET', '/courses', params=params)
        return response.get('data', [])
    
    def get_course(self, course_id: str) -> Dict:
        """Get specific course by ID"""
        response = self._make_request('GET', f'/courses/{course_id}')
        return response
    
    def create_course(self, course_data: Dict) -> Dict:
        """Create new course"""
        response = self._make_request('POST', '/courses', json=course_data)
        return response
    
    def update_course(self, course_id: str, course_data: Dict) -> Dict:
        """Update existing course"""
        response = self._make_request('PUT', f'/courses/{course_id}', json=course_data)
        return response
    
    def delete_course(self, course_id: str) -> Dict:
        """Delete course"""
        response = self._make_request('DELETE', f'/courses/{course_id}')
        return response
    
    # Quiz management
    def get_quizzes(self, filters: Dict = None) -> List[Dict]:
        """Get list of quizzes"""
        params = filters or {}
        response = self._make_request('GET', '/quizzes', params=params)
        return response.get('data', [])
    
    def get_quiz(self, quiz_id: str) -> Dict:
        """Get specific quiz by ID"""
        response = self._make_request('GET', f'/quizzes/{quiz_id}')
        return response
    
    def create_quiz(self, quiz_data: Dict) -> Dict:
        """Create new quiz"""
        response = self._make_request('POST', '/quizzes', json=quiz_data)
        return response
    
    def submit_quiz(self, quiz_id: str, answers: List[Dict]) -> Dict:
        """Submit quiz answers"""
        data = {'answers': answers}
        response = self._make_request('POST', f'/quizzes/{quiz_id}/submit', json=data)
        return response
    
    # File management
    def upload_file(self, file_path: str, metadata: Dict = None) -> Dict:
        """Upload file to Voicera AI"""
        with open(file_path, 'rb') as file:
            files = {'file': file}
            data = {'metadata': json.dumps(metadata or {})}
            response = self._make_request('POST', '/files/upload', files=files, data=data)
        return response
    
    def get_file(self, file_id: str) -> Dict:
        """Get file information"""
        response = self._make_request('GET', f'/files/{file_id}')
        return response
    
    def delete_file(self, file_id: str) -> Dict:
        """Delete file"""
        response = self._make_request('DELETE', f'/files/{file_id}')
        return response
    
    # Voice commands
    def process_voice_command(self, command: str, context: Dict = None) -> Dict:
        """Process voice command"""
        data = {
            'command': command,
            'context': context or {}
        }
        response = self._make_request('POST', '/voice/process', json=data)
        return response
    
    def get_voice_commands(self, filters: Dict = None) -> List[Dict]:
        """Get voice commands"""
        params = filters or {}
        response = self._make_request('GET', '/voice/commands', params=params)
        return response.get('data', [])
    
    # Analytics
    def get_analytics(self, analytics_type: str, filters: Dict = None) -> Dict:
        """Get analytics data"""
        params = filters or {}
        response = self._make_request('GET', f'/analytics/{analytics_type}', params=params)
        return response
    
    def get_real_time_metrics(self) -> Dict:
        """Get real-time metrics"""
        response = self._make_request('GET', '/analytics/real-time')
        return response
    
    # Webhooks
    def create_webhook(self, webhook_data: Dict) -> Dict:
        """Create webhook"""
        response = self._make_request('POST', '/webhooks', json=webhook_data)
        return response
    
    def get_webhooks(self) -> List[Dict]:
        """Get webhooks"""
        response = self._make_request('GET', '/webhooks')
        return response.get('data', [])
    
    def delete_webhook(self, webhook_id: str) -> Dict:
        """Delete webhook"""
        response = self._make_request('DELETE', f'/webhooks/{webhook_id}')
        return response
    
    def verify_webhook_signature(self, payload: str, signature: str, secret: str) -> bool:
        """Verify webhook signature"""
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_signature)
    
    # Rate limiting
    def check_rate_limit(self) -> Dict:
        """Check rate limit status"""
        response = self._make_request('GET', '/rate-limit')
        return response
    
    # Health check
    def health_check(self) -> Dict:
        """Check API health"""
        response = self._make_request('GET', '/health')
        return response

# Utility functions
def create_sdk(config: Dict[str, Any]) -> VoiceraSDK:
    """Create new SDK instance"""
    return VoiceraSDK(config)

def verify_webhook_signature(payload: str, signature: str, secret: str) -> bool:
    """Verify webhook signature"""
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)

# Export main classes and functions
__all__ = ['VoiceraSDK', 'VoiceraError', 'create_sdk', 'verify_webhook_signature']
