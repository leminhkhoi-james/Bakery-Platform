-- DEV/TEST ONLY. Substitute :request_id with a quoted UUID of an existing Marketplace request.
INSERT INTO generation_jobs(id,customer_id,cake_request_id,status,model_name) VALUES
('40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',:request_id,'SUCCEEDED','fixture');
INSERT INTO prompt_revisions(id,generation_job_id,revision_number,prompt_text,created_by) VALUES
('40000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001',1,'Fixture chocolate cake','10000000-0000-0000-0000-000000000001');
INSERT INTO generated_designs(id,generation_job_id,prompt_revision_id,image_object_key,moderation_status) VALUES
('40000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002','cake-ai/fixtures/design.png','APPROVED');
