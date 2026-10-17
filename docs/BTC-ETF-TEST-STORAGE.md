# BTC ETF test storage

This folder documents the disposable test-storage rehearsal. The automated test creates a temporary synthetic capture, archives it using the existing offline archive writer, verifies SHA-256 checksums, copies it to a separate temporary backup directory, restores it into a clean directory, and verifies again. It then alters a restored file and expects verification to fail.

All payloads are synthetic test data. The test-rights fixture is explicitly not a real rights attestation. No provider requests, production database writes, source-priority changes, or scenario evaluation are performed. Temporary test files are deleted after the test.

This validates software behavior only; it is not a claim that a permanent private archive or independent production backup exists.