"""
Smart Notes AI - Optimized TF-IDF Document Retrieval Module
Implements fast, explainable statistical retrieval using Scikit-Learn's TfidfVectorizer.
Includes smart query intent detection (e.g., general overview queries) and fast sparse matrix multiplication.
"""

from typing import List, Dict, Any, Optional
import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Common phrases where student asks for general overview or document topic
OVERVIEW_QUERY_PATTERNS = [
    r'\bwhat is this (pdf|document|note|book|file) about\b',
    r'\bwhat are these notes about\b',
    r'\b(overview|summary|topics?|syllabus|contents?)\b',
    r'\btell me about this (pdf|document|file)\b',
    r'\bwhat does this (pdf|document) cover\b'
]


class TfidfRetriever:
    """
    Ranks document chunks against a user's academic question using Term Frequency-Inverse
    Document Frequency (TF-IDF) and Cosine Similarity.
    """

    def __init__(self, stop_words: str = "english", ngram_range: tuple = (1, 2)):
        self.vectorizer = TfidfVectorizer(
            stop_words=stop_words,
            ngram_range=ngram_range,
            lowercase=True,
            sublinear_tf=True,
            max_df=0.98,
            min_df=1
        )
        self.chunks: List[Dict[str, Any]] = []
        self.tfidf_matrix = None
        self.is_fitted = False

    def fit(self, chunks: List[Dict[str, Any]]) -> None:
        """
        Fits the TF-IDF model on document chunks.
        """
        if not chunks:
            raise ValueError("Cannot fit TF-IDF retriever on an empty chunk list.")

        self.chunks = chunks
        chunk_texts = [chunk["text"] for chunk in chunks]
        self.tfidf_matrix = self.vectorizer.fit_transform(chunk_texts)
        self.is_fitted = True

    def _is_overview_query(self, query: str) -> bool:
        """Detects whether user is asking a broad overview question."""
        q_lower = query.lower().strip()
        for pattern in OVERVIEW_QUERY_PATTERNS:
            if re.search(pattern, q_lower):
                return True
        return False

    def retrieve(
        self,
        query: str,
        top_k: int = 3,
        threshold: float = 0.03
    ) -> List[Dict[str, Any]]:
        """
        Retrieves the top_k most relevant chunks for a question.
        Optimized for speed and robustness against generic stop-word queries.
        """
        if not self.is_fitted or self.tfidf_matrix is None:
            raise RuntimeError("Retriever has not been fitted with document chunks yet.")

        query_clean = query.strip()
        if not query_clean:
            return self.get_summary_chunks(max_chunks=top_k)

        # If user is asking a general overview question (e.g. "what is this pdf about")
        if self._is_overview_query(query_clean):
            return self.get_summary_chunks(max_chunks=top_k)

        # Fast TF-IDF vectorization of query
        try:
            query_vec = self.vectorizer.transform([query_clean])
        except Exception:
            return self.get_summary_chunks(max_chunks=top_k)

        # If query contains zero recognized non-stopword vocabulary
        if query_vec.nnz == 0:
            return self.get_summary_chunks(max_chunks=top_k)

        # Compute cosine similarities via fast sparse dot product
        # query_vec: (1, vocab_size), tfidf_matrix.T: (vocab_size, n_chunks)
        scores = (query_vec * self.tfidf_matrix.T).toarray().flatten()

        max_score = float(scores.max()) if len(scores) > 0 else 0.0
        if max_score < threshold:
            # Low or no direct keyword overlap -> provide representative stratified chunks
            return self.get_summary_chunks(max_chunks=top_k)

        # Get top-k indices using argpartition (O(N) instead of O(N log N))
        n_chunks = len(scores)
        k = min(top_k, n_chunks)
        if n_chunks > k:
            top_indices = np.argpartition(scores, -k)[-k:]
            # Sort only the top k
            top_indices = top_indices[np.argsort(scores[top_indices])[::-1]]
        else:
            top_indices = np.argsort(scores)[::-1]

        results = []
        for idx in top_indices:
            score = float(scores[idx])
            if score >= threshold:
                chunk_copy = dict(self.chunks[idx])
                chunk_copy["similarity_score"] = round(score, 4)
                results.append(chunk_copy)

        return results if results else self.get_summary_chunks(max_chunks=top_k)

    def get_summary_chunks(self, max_chunks: int = 4) -> List[Dict[str, Any]]:
        """
        Extracts stratified representative chunks across the document
        (e.g., Introduction, Early Sections, Middle Topics, Conclusion).
        """
        if not self.chunks:
            return []

        if len(self.chunks) <= max_chunks:
            res = []
            for c in self.chunks:
                copy_c = dict(c)
                copy_c.setdefault("similarity_score", 0.50)
                res.append(copy_c)
            return res

        # Evenly spaced sample across document indices
        step = len(self.chunks) / max_chunks
        sampled_indices = [int(i * step) for i in range(max_chunks)]
        unique_indices = sorted(list(set(min(i, len(self.chunks) - 1) for i in sampled_indices)))

        results = []
        for i in unique_indices:
            chunk_copy = dict(self.chunks[i])
            chunk_copy.setdefault("similarity_score", 0.50)
            results.append(chunk_copy)

        return results
