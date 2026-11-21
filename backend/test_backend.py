"""
Smart Notes AI - Comprehensive Backend & Retrieval Test Suite
Tests:
1. Academic PDF generation with PyMuPDF
2. Page-by-page text extraction & cleanup
3. Overlapping text chunking with page number preservation
4. TF-IDF vectorization and cosine similarity retrieval
5. FastAPI endpoints via TestClient (upload, health, retrieval, docs)
6. Error handling (corrupted file, empty file, non-PDF file)
"""

import os
import io
import pymupdf
from fastapi.testclient import TestClient
from main import app, documents_db
from pdf_processor import extract_pdf_pages, chunk_document, PDFProcessingError
from retrieval import TfidfRetriever

client = TestClient(app)

def create_sample_academic_pdf() -> bytes:
    """Generates a realistic 3-page academic PDF using PyMuPDF in memory."""
    doc = pymupdf.open()

    # Page 1: Introduction to Distributed Systems
    page1 = doc.new_page()
    text_p1 = """Distributed Systems: Fundamentals and Architectures
Lecture Notes - Computer Science Department - Unit 1

1. Introduction to Distributed Systems
A distributed system is a collection of autonomous computing entities that communicate over a network
and coordinate their actions by passing messages. The components interact with each other in order to
achieve a common goal. To the end user, a distributed system appears as a single coherent computer system.

Key characteristics of distributed systems include:
- Concurrency of components: Execution of concurrent tasks on separate machines.
- Lack of a global clock: Synchronizing time across multiple nodes relies on logical clocks like Lamport timestamps.
- Independent failures: Nodes can fail independently without stopping the entire network.

2. Remote Procedure Calls (RPC)
RPC is an inter-process communication technique that allows a program to cause a procedure to execute in another
address space (commonly on another computer on a shared network), without the programmer explicitly coding the
details for the remote interaction.
"""
    page1.insert_text((50, 70), text_p1, fontsize=11)

    # Page 2: Consensus and the Raft Protocol
    page2 = doc.new_page()
    text_p2 = """Distributed Systems: Consensus Protocols
Lecture Notes - Computer Science Department - Unit 2

3. The Consensus Problem
Consensus is the fundamental problem in fault-tolerant distributed computing. Nodes must agree on a single data
value or state transition even in the presence of unreliable network connections and node crashes.
The FLP Impossibility Theorem (Fischer, Lynch, Paterson 1985) proves that no deterministic asynchronous algorithm
can guarantee consensus in the presence of even a single unannounced fail-stop process failure.

4. The Raft Consensus Algorithm
Raft is a consensus algorithm designed to be understandable and maintainable. It decomposes consensus into three
independent subproblems:
- Leader Election: A single leader node is elected among the cluster when the previous leader fails.
- Log Replication: The leader accepts log entries from clients and replicates them across follower nodes.
- Safety: If any server has applied a particular log entry to its state machine, no other server may apply a different
log entry for the same log index.
"""
    page2.insert_text((50, 70), text_p2, fontsize=11)

    # Page 3: CAP Theorem and Consistency Models
    page3 = doc.new_page()
    text_p3 = """Distributed Systems: Storage & CAP Theorem
Lecture Notes - Computer Science Department - Unit 3

5. The CAP Theorem
Formulated by Eric Brewer in 2000, the CAP theorem states that any distributed data store can simultaneously
provide at most two of the following three guarantees:
- Consistency (C): Every read receives the most recent write or an error.
- Availability (A): Every non-failing node returns a non-error response for every request.
- Partition Tolerance (P): The system continues to operate despite an arbitrary number of messages being dropped
or delayed by the network between nodes.

In the real world, network partitions are inevitable; therefore, architects must choose between CP (Consistency and
Partition tolerance) and AP (Availability and Partition tolerance).

6. Eventual Consistency
In an AP system, replicas may temporarily diverge during partitions, but will eventually converge to identical
states when communication is restored, a property known as eventual consistency.
"""
    page3.insert_text((50, 70), text_p3, fontsize=11)

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def run_all_tests():
    print("=" * 60)
    print("RUNNING SMART NOTES AI BACKEND VERIFICATION SUITE")
    print("=" * 60)

    # Test 1: Health check
    print("\n[Test 1] Testing /api/health endpoint...")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    health_data = res.json()
    print(" Health response:", health_data)
    assert health_data["status"] == "healthy"
    assert "gemini_model" in health_data

    # Test 2: PDF generation and extraction
    print("\n[Test 2] Testing PyMuPDF text extraction...")
    pdf_bytes = create_sample_academic_pdf()
    pages = extract_pdf_pages(pdf_bytes, "Distributed_Systems_Notes.pdf")
    print(f" Extracted {len(pages)} pages successfully.")
    assert len(pages) == 3, f"Expected 3 pages, got {len(pages)}"
    assert pages[0]["page_number"] == 1
    assert "Distributed Systems" in pages[0]["text"]
    assert pages[1]["page_number"] == 2
    assert "Raft Consensus" in pages[1]["text"]
    assert pages[2]["page_number"] == 3
    assert "CAP Theorem" in pages[2]["text"]

    # Test 3: Text chunking
    print("\n[Test 3] Testing chunking with page number preservation...")
    chunks = chunk_document(pages, chunk_size=400, chunk_overlap=100)
    print(f" Generated {len(chunks)} chunks.")
    assert len(chunks) >= 3, "Expected at least 3 chunks"
    for c in chunks:
        assert "page_number" in c
        assert "text" in c
        assert "chunk_id" in c
        print(f"   Chunk {c['chunk_id']} -> Page {c['page_number']} ({c['word_count']} words): '{c['text'][:55]}...'")

    # Test 4: TF-IDF retrieval
    print("\n[Test 4] Testing Scikit-learn TF-IDF retrieval...")
    retriever = TfidfRetriever()
    retriever.fit(chunks)

    # Query 1: Raft Consensus
    query1 = "How does the Raft algorithm elect a leader and maintain safety?"
    results1 = retriever.retrieve(query1, top_k=3)
    print(f" Query: '{query1}'")
    assert len(results1) > 0, "Expected at least one matching chunk"
    top_result = results1[0]
    print(f" Top result: Page {top_result['page_number']} | Score: {top_result['similarity_score']}")
    print(f" Excerpt: {top_result['text'][:100]}...")
    assert top_result["page_number"] == 2, f"Expected Page 2 for Raft question, got {top_result['page_number']}"

    # Query 2: CAP Theorem
    query2 = "What are Consistency and Availability in the CAP theorem?"
    results2 = retriever.retrieve(query2, top_k=3)
    print(f" Query: '{query2}'")
    assert len(results2) > 0
    top_cap = results2[0]
    print(f" Top result: Page {top_cap['page_number']} | Score: {top_cap['similarity_score']}")
    assert top_cap["page_number"] == 3, f"Expected Page 3 for CAP theorem question, got {top_cap['page_number']}"

    # Test 5: Full API upload endpoint
    print("\n[Test 5] Testing POST /api/upload via TestClient...")
    files = {"file": ("Distributed_Systems_Notes.pdf", pdf_bytes, "application/pdf")}
    res_upload = client.post("/api/upload", files=files)
    assert res_upload.status_code == 200, f"Upload failed: {res_upload.text}"
    upload_data = res_upload.json()
    print(" Upload response:", upload_data)
    doc_id = upload_data["document_id"]
    assert upload_data["total_pages"] == 3
    assert upload_data["filename"] == "Distributed_Systems_Notes.pdf"

    # Test 6: Document details & list
    print("\n[Test 6] Testing GET /api/documents and GET /api/document/{id}...")
    res_list = client.get("/api/documents")
    assert res_list.status_code == 200
    docs = res_list.json()["documents"]
    assert any(d["document_id"] == doc_id for d in docs)

    res_detail = client.get(f"/api/document/{doc_id}")
    assert res_detail.status_code == 200
    detail_data = res_detail.json()
    assert len(detail_data["pages"]) == 3

    # Test 7: Error handling for invalid files
    print("\n[Test 7] Testing error handling (corrupted/empty/invalid format)...")
    # Empty file
    res_empty = client.post("/api/upload", files={"file": ("empty.pdf", b"", "application/pdf")})
    assert res_empty.status_code == 400
    print(" Correctly rejected empty file (400):", res_empty.json()["detail"])

    # Non-PDF
    res_non_pdf = client.post("/api/upload", files={"file": ("notes.txt", b"Hello", "text/plain")})
    assert res_non_pdf.status_code == 400
    print(" Correctly rejected non-PDF (400):", res_non_pdf.json()["detail"])

    # Corrupted PDF
    res_corrupt = client.post("/api/upload", files={"file": ("broken.pdf", b"NOT A REAL PDF CONTENT", "application/pdf")})
    assert res_corrupt.status_code == 422
    print(" Correctly handled corrupted PDF (422):", res_corrupt.json()["detail"])

    # Test 8: Document deletion
    print("\n[Test 8] Testing DELETE /api/document/{id}...")
    res_del = client.delete(f"/api/document/{doc_id}")
    assert res_del.status_code == 200
    print(" Deleted doc response:", res_del.json())

    # Verify 404 after deletion
    res_404 = client.get(f"/api/document/{doc_id}")
    assert res_404.status_code == 404
    print(" Correctly returned 404 after deletion.")

    print("\n" + "=" * 60)
    print("ALL BACKEND & RETRIEVAL TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    run_all_tests()

