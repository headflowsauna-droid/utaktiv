"""
Utaktiv Social Media Engine - Base Platform Client
Definerer felles grensesnitt for sosiale medier (X, LinkedIn, TikTok).
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from scripts.social_engine.models import SocialPost


class BasePlatformClient(ABC):
    def __init__(self, dry_run: bool = True):
        self.dry_run = dry_run

    @abstractmethod
    def check_connection(self) -> Dict[str, Any]:
        """Sjekker om API-nøkler er gyldige og koblingen virker."""
        pass

    @abstractmethod
    def publish(self, post: SocialPost) -> Dict[str, Any]:
        """
        Publiserer et innlegg.
        Hvis dry_run=True, simuleres publiseringen og returnerer en forhåndsvisning.
        Hvis dry_run=False, gjøres det faktiske API-kallet.
        """
        pass
