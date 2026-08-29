import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import SOPDocument


class SOPRAGService:
    """
    In-Memory SOP RAG Retriever
    Uses keyword overlap and term-frequency matching for sub-millisecond document retrieval over industrial SOP catalogs.
    """

    def search_sops(
        self,
        db: Session,
        query: str,
        target_component: Optional[str] = None,
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Retrieves matching SOP documents from database or fallback catalog.
        """
        # Query database records
        db_sops = db.query(SOPDocument).all()
        sops_list = []

        if db_sops:
            for s in db_sops:
                sops_list.append({
                    "id": s.id,
                    "sop_code": s.sop_code,
                    "title": s.title,
                    "target_component": s.target_component,
                    "content_markdown": s.content_markdown
                })
        else:
            # Fallback catalog if DB not yet populated
            sops_list = [
                {
                    "id": "SOP-M204-BEARING",
                    "sop_code": "SOP-M204-BEARING",
                    "title": "Centrifugal Compressor Emergency Bearing & Thermal Isolation SOP",
                    "target_component": "Centrifugal Compressor M-204 / Journal Bearing",
                    "content_markdown": "# SOP-M204-BEARING\n\nEmergency Procedure for Journal Bearing Overheating & Harmonic Vibration Spikes..."
                },
                {
                    "id": "SOP-PUMP-LUBE",
                    "sop_code": "SOP-PUMP-LUBE",
                    "title": "Auxiliary Lube Oil Pump Operational SOP",
                    "target_component": "Auxiliary Lube Pump AP-02",
                    "content_markdown": "# SOP-PUMP-LUBE\n\nStandard Operating Procedure for Auxiliary Lube Oil Flush..."
                }
            ]

        # Score documents based on query terms and component relevance
        query_words = set(re.findall(r'\w+', query.lower()))
        scored_sops = []

        for sop in sops_list:
            text = (sop["title"] + " " + sop["target_component"] + " " + sop["content_markdown"]).lower()
            doc_words = set(re.findall(r'\w+', text))

            # Term overlap score
            overlap = len(query_words.intersection(doc_words))
            score = float(overlap)

            # Target component boost
            if target_component and target_component.lower() in sop["target_component"].lower():
                score += 10.0

            if "m-204" in query.lower() and "m-204" in sop["sop_code"].lower():
                score += 15.0

            if "bearing" in query.lower() and "bearing" in sop["sop_code"].lower():
                score += 10.0

            scored_sops.append((score, sop))

        # Sort descending by score
        scored_sops.sort(key=lambda x: x[0], reverse=True)

        results = []
        for score, sop in scored_sops[:top_k]:
            results.append({
                **sop,
                "relevance_score": round(score, 2)
            })

        return results


sop_rag_service = SOPRAGService()
