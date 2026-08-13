KIẾN TRÚC CƠ SỞ DỮ LIỆU & SƠ ĐỒ THỰC THỂ LIÊN KẾT (ERD)

Hệ thống Quản lý Nghiên cứu Khoa học & Thẩm định Y sinh (HIS-CRMS)

Phạm vi nghiệp vụ: quản lý vòng đời đề tài nghiên cứu khoa học tại bệnh viện từ đăng ký, thẩm định hành chính, xét duyệt đề cương, đạo đức nghiên cứu, giao thực hiện, theo dõi tiến độ, điều chỉnh/gia hạn, nghiệm thu, công nhận kết quả, tài chính và lưu trữ.

Lưu ý pháp lý: Thông tư 43/2024/TT-BYT là căn cứ trực tiếp đối với việc thành lập, tổ chức và hoạt động của Hội đồng đạo đức trong nghiên cứu y sinh học. Các quy trình quản lý đề tài NCKH cấp cơ sở của bệnh viện cần được cấu hình theo quy chế/quy trình nội bộ và các văn bản chuyên ngành áp dụng cho từng loại nhiệm vụ. Không sử dụng Thông tư 09/2024/TT-BYT làm căn cứ cho quản lý NCKH vì văn bản này thuộc lĩnh vực danh mục thuốc/nguyên liệu làm thuốc/mỹ phẩm xuất nhập khẩu.

1. Nguyên tắc kiến trúc nghiệp vụ

Kiến trúc dữ liệu được tổ chức theo chuỗi:

Business Architecture → Capability → Workflow → Business Rules → State → Data → Software

Các nguyên tắc chính:

PROJECTS chỉ lưu macro lifecycle của đề tài; không nhồi toàn bộ trạng thái chi tiết vào một cột status.

Trạng thái thẩm định đề xuất dùng proposal_status.

Trạng thái đạo đức dùng ethics_status.

Trạng thái Hội đồng dùng council_status.

Trạng thái hồ sơ nghiệm thu dùng acceptance_dossier_status.

Trạng thái Quyết định dùng decision_status.

Chỉ chuyển macro-state của đề tài khi business gate tương ứng đã hoàn tất.

Các cấu hình đặc thù bệnh viện như chu kỳ báo cáo 1/3/6 tháng, bộ hồ sơ bắt buộc, số lượng thành viên Hội đồng, ngưỡng đạt... đặt trong WORKFLOW_POLICIES, không hardcode trong UI.

ADMIN là vai trò quản trị hệ thống, không tự động kế thừa quyền nghiệp vụ của Phòng NCKH, Hội đồng, Đạo đức hoặc Giám đốc.

Mọi thay đổi trạng thái quan trọng phải có AUDIT_LOGS và lịch sử trạng thái tương ứng.

2. Sơ đồ thực thể liên kết toàn diện

erDiagram
    DEPARTMENTS ||--o{ USERS : "quản lý nhân sự"
    DEPARTMENTS ||--o{ PROJECTS : "đơn vị chủ trì"

    USERS ||--o{ PROJECTS : "chủ nhiệm"
    USERS ||--o{ PROJECT_MEMBERS : "tham gia"
    USERS ||--o{ COUNCIL_MEMBERS : "tham gia Hội đồng"
    USERS ||--o{ EVALUATION_RESULTS : "nộp phiếu đánh giá"
    USERS ||--o{ PROGRESS_REPORTS : "nộp báo cáo"
    USERS ||--o{ CHANGE_REQUESTS : "gửi yêu cầu"
    USERS ||--o{ AUDIT_LOGS : "thực hiện tác vụ"
    USERS ||--o{ NOTIFICATIONS : "nhận thông báo"
    USERS ||--o{ WORK_ITEMS : "được giao xử lý"

    WORKFLOW_POLICIES ||--o{ REGISTRATION_ROUNDS : "áp dụng"
    WORKFLOW_POLICIES ||--o{ PROJECTS : "điều khiển workflow"
    REGISTRATION_ROUNDS ||--o{ PROJECTS : "tiếp nhận"

    PROJECTS ||--o{ PROJECT_MEMBERS : "nhóm nghiên cứu"
    PROJECTS ||--o{ PROJECT_STATUS_HISTORY : "lịch sử macro-state"
    PROJECTS ||--o{ PROJECT_MILESTONES : "mốc tiến độ"
    PROJECTS ||--o{ PROJECT_BUDGET_ITEMS : "dự toán"
    PROJECTS ||--o{ PROJECT_DOCUMENTS : "hồ sơ/tài liệu"
    PROJECT_DOCUMENTS ||--o{ DOCUMENT_VERSIONS : "phiên bản"

    PROJECTS ||--o| ETHICS_APPROVALS : "hồ sơ đạo đức hiện hành"
    ETHICS_APPROVALS ||--o{ ETHICS_STATUS_HISTORY : "lịch sử đạo đức"

    PROJECTS ||--o{ COUNCIL_PROJECT_ASSIGNMENTS : "được đưa vào HĐ"
    COUNCILS ||--o{ COUNCIL_PROJECT_ASSIGNMENTS : "xử lý đề tài"
    COUNCILS ||--o{ COUNCIL_MEMBERS : "thành viên"
    COUNCIL_PROJECT_ASSIGNMENTS ||--o{ EVALUATION_RESULTS : "phiếu đánh giá"
    COUNCIL_PROJECT_ASSIGNMENTS ||--o| MEETING_MINUTES : "biên bản"

    PROJECTS ||--o{ PROGRESS_REPORTS : "báo cáo định kỳ"
    PROJECTS ||--o{ CHANGE_REQUESTS : "gia hạn/điều chỉnh"
    CHANGE_REQUESTS ||--o{ CHANGE_REQUEST_DIFFS : "nội dung thay đổi"

    PROJECTS ||--o| ACCEPTANCE_DOSSIERS : "hồ sơ nghiệm thu"
    ACCEPTANCE_DOSSIERS ||--o{ ACCEPTANCE_CHECKLIST_ITEMS : "checklist hành chính"
    ACCEPTANCE_DOSSIERS ||--o{ POST_ACCEPTANCE_REVISIONS : "chỉnh sửa sau nghiệm thu"

    PROJECTS ||--o{ DECISIONS : "quyết định pháp lý"
    PROJECTS ||--o{ RESEARCH_CONTRACTS : "hợp đồng nếu áp dụng"

    PROJECTS ||--o{ FINANCIAL_VOUCHERS : "chứng từ"
    PROJECTS ||--o{ PROJECT_PUBLICATIONS : "công bố"
    PROJECTS ||--o{ CLINICAL_APPLICATIONS : "chuyển giao ứng dụng"

    PROJECTS ||--o{ WORK_ITEMS : "sinh công việc"
    PROJECTS ||--o{ NOTIFICATIONS : "phát thông báo"

    WORKFLOW_POLICIES {
        uuid id PK
        string code
        string name
        boolean requires_scientific_review
        boolean requires_ethics_review
        string ethics_review_mode
        json required_documents_by_step
        json progress_reporting_policy
        json council_policy
        json custom_project_types
        json custom_funding_sources
        boolean is_active
    }

    REGISTRATION_ROUNDS {
        uuid id PK
        string round_code
        string name
        int year
        date start_date
        date end_date
        uuid workflow_policy_id FK
        decimal max_budget_per_project
        string status
    }

    USERS {
        uuid id PK
        string full_name
        string email
        string phone
        string academic_title
        string role
        uuid department_id FK
        boolean is_active
    }

    DEPARTMENTS {
        uuid id PK
        string department_code
        string name
        string department_type
        uuid manager_id FK
    }

    PROJECTS {
        uuid id PK
        string proposal_code
        string project_code
        string title
        text summary
        string research_field
        string management_level
        string project_type
        uuid principal_investigator_id FK
        uuid department_id FK
        uuid registration_round_id FK
        uuid workflow_policy_id FK
        date start_date
        date end_date
        decimal estimated_budget
        decimal approved_budget
        string funding_source
        int reported_progress_percentage
        string proposal_status
        string status
        string ethics_status
        boolean ethics_required
        timestamp submitted_at
        timestamp created_at
        timestamp updated_at
    }

    PROJECT_STATUS_HISTORY {
        uuid id PK
        uuid project_id FK
        string from_status
        string to_status
        uuid changed_by FK
        text reason
        timestamp changed_at
    }

    PROJECT_MEMBERS {
        uuid id PK
        uuid project_id FK
        uuid user_id FK
        string full_name
        string unit
        string role_in_project
        int contribution_percentage
    }

    PROJECT_MILESTONES {
        uuid id PK
        uuid project_id FK
        string milestone_name
        int sequence_order
        date target_date
        date completed_date
        string status
    }

    PROJECT_BUDGET_ITEMS {
        uuid id PK
        uuid project_id FK
        string expense_category
        string item_name
        decimal unit_price
        int quantity
        decimal total_amount
    }

    PROJECT_DOCUMENTS {
        uuid id PK
        uuid project_id FK
        string document_type
        string title
        uuid current_version_id FK
        timestamp created_at
    }

    DOCUMENT_VERSIONS {
        uuid id PK
        uuid document_id FK
        int version
        string file_name
        string file_size
        string download_url
        uuid uploaded_by FK
        timestamp uploaded_at
    }

    ETHICS_APPROVALS {
        uuid id PK
        uuid project_id FK
        string ethics_status
        string review_type
        string approval_number
        date approved_at
        date valid_until
        text conditions
        text response_comment
    }

    ETHICS_STATUS_HISTORY {
        uuid id PK
        uuid ethics_approval_id FK
        string from_status
        string to_status
        uuid changed_by FK
        text comment
        timestamp changed_at
    }

    COUNCILS {
        uuid id PK
        string council_code
        string name
        string council_type
        string status
        string decision_status
        string decision_number
        date meeting_date
        string location
        decimal min_pass_ratio
        timestamp established_at
    }

    COUNCIL_MEMBERS {
        uuid id PK
        uuid council_id FK
        uuid user_id FK
        string full_name
        string role_in_council
        boolean has_conflict_of_interest
    }

    COUNCIL_PROJECT_ASSIGNMENTS {
        uuid id PK
        uuid council_id FK
        uuid project_id FK
        json reviewer_assignments
        timestamp assigned_at
    }

    EVALUATION_RESULTS {
        uuid id PK
        uuid council_id FK
        uuid project_id FK
        uuid council_member_id FK
        string council_member_name
        string role_in_council
        json scores
        decimal total_score
        string vote_result
        text comments
        string status
        timestamp submitted_at
        timestamp signed_at
    }

    MEETING_MINUTES {
        uuid id PK
        uuid council_id FK
        uuid project_id FK
        date meeting_date
        string location
        uuid secretary_id FK
        string secretary_name
        uuid chair_id FK
        string chair_name
        int attendees_count
        text summary_opinions
        string conclusion
        decimal average_score
        int pass_vote_count
        int total_vote_count
        text revision_requirements
        string status
        timestamp secretary_signed_at
        timestamp chair_signed_at
    }

    PROGRESS_REPORTS {
        uuid id PK
        uuid project_id FK
        string report_period
        date due_date
        int reported_completion_percentage
        text completed_tasks
        text difficulties
        text next_period_plan
        string status
        uuid submitted_by FK
        timestamp submitted_at
        text reviewer_comment
    }

    CHANGE_REQUESTS {
        uuid id PK
        uuid project_id FK
        string type
        string title
        text reason
        string explanation_doc_url
        string status
        uuid submitted_by FK
        string submitted_by_name
        timestamp submitted_at
        uuid approved_by FK
        timestamp approved_at
        text response_comment
    }

    CHANGE_REQUEST_DIFFS {
        uuid id PK
        uuid change_request_id FK
        string field_name
        text current_value
        text proposed_value
        text reason
    }

    ACCEPTANCE_DOSSIERS {
        uuid id PK
        uuid project_id FK
        string status
        int claimed_overall_completion_percentage
        uuid submitted_by FK
        timestamp submitted_at
        text reviewer_comment
    }

    ACCEPTANCE_CHECKLIST_ITEMS {
        uuid id PK
        uuid acceptance_dossier_id FK
        string code
        string label
        boolean passed
        text comment
        uuid checked_by FK
        timestamp checked_at
    }

    POST_ACCEPTANCE_REVISIONS {
        uuid id PK
        uuid acceptance_dossier_id FK
        text requirement
        string status
        uuid confirmed_by FK
        timestamp confirmed_at
    }

    DECISIONS {
        uuid id PK
        uuid project_id FK
        string type
        string status
        string decision_number
        date decision_date
        string title
        uuid drafted_by FK
        string signed_by
        timestamp signed_at
        uuid issued_by FK
        timestamp issued_at
        text return_reason
    }

    RESEARCH_CONTRACTS {
        uuid id PK
        uuid project_id FK
        string contract_number
        date signed_date
        decimal contract_value
        string status
    }

    FINANCIAL_VOUCHERS {
        uuid id PK
        uuid project_id FK
        string voucher_code
        string expense_category
        decimal amount
        date issue_date
        string status
        string voucher_file_url
    }

    PROJECT_PUBLICATIONS {
        uuid id PK
        uuid project_id FK
        string publication_type
        string title
        string journal_name
        string ranking
        string doi_or_url
        date publication_date
    }

    CLINICAL_APPLICATIONS {
        uuid id PK
        uuid project_id FK
        string protocol_name
        uuid target_department_id FK
        string handover_decision_number
        date handover_date
        text effectiveness_evaluation
    }

    WORK_ITEMS {
        uuid id PK
        uuid project_id FK
        uuid assignee_id FK
        string work_type
        string status
        date due_date
        string action_url
        timestamp created_at
        timestamp completed_at
    }

    NOTIFICATIONS {
        uuid id PK
        uuid project_id FK
        uuid recipient_id FK
        string title
        string message
        string action_url
        boolean is_read
        timestamp created_at
    }

    AUDIT_LOGS {
        uuid id PK
        uuid user_id FK
        string action
        string entity_name
        string entity_id
        json old_values
        json new_values
        timestamp created_at
    }

3. State model chuẩn

3.1. ProjectStatus — macro lifecycle

DRAFT
→ SUBMITTED
→ WAITING_ASSIGNMENT
→ IN_PROGRESS
→ WAITING_ACCEPTANCE
→ ACCEPTED
→ RECOGNIZED
→ CLOSED
→ ARCHIVED

Nhánh ngoại lệ:

SUBMITTED / WAITING_ASSIGNMENT → REJECTED

IN_PROGRESS → SUSPENDED → IN_PROGRESS

IN_PROGRESS / SUSPENDED / WAITING_ACCEPTANCE → TERMINATED

Không sử dụng các macro-state legacy: UNDER_REVIEW, APPROVED, ASSIGNED.

3.2. ProposalStatus

DRAFT
→ SUBMITTED
→ UNDER_ADMIN_REVIEW
→ ADMIN_VALIDATED
→ OUTLINE_SUBMITTED
→ UNDER_PROPOSAL_REVIEW
→ PROPOSAL_APPROVED

Nhánh sửa đổi:

UNDER_ADMIN_REVIEW
→ REVISION_REQUIRED
→ RESUBMITTED
→ UNDER_ADMIN_REVIEW

Sau Hội đồng:

UNDER_PROPOSAL_REVIEW
→ PROPOSAL_REVISION_REQUIRED
→ PROPOSAL_RESUBMITTED
→ UNDER_PROPOSAL_REVISION_REVIEW
→ PROPOSAL_APPROVED

Có thể kết thúc bằng REJECTED.

3.3. EthicsStatus

SCREENING_IN_PROGRESS
→ NOT_REQUIRED
hoặc
→ DOSSIER_SUBMITTED
→ UNDER_ETHICS_REVIEW
→ ETHICS_APPROVED

Nhánh sửa đổi/kết thúc:

UNDER_ETHICS_REVIEW
→ ETHICS_REVISION_REQUIRED
→ DOSSIER_SUBMITTED

UNDER_ETHICS_REVIEW
→ CONDITIONALLY_APPROVED
→ ETHICS_APPROVED

UNDER_ETHICS_REVIEW
→ ETHICS_REJECTED

Trạng thái hậu phê duyệt/kết thúc gồm: EXPIRED, SUSPENDED, WITHDRAWN, TERMINATED.

3.4. CouncilStatus

DRAFT
→ ESTABLISHED
→ EVALUATING
→ MINUTES_DRAFTED
→ CONCLUDED

Có thể DISSOLVED theo quy trình quản trị Hội đồng.

3.5. AcceptanceDossierStatus

NOT_SUBMITTED
→ DRAFT
→ SUBMITTED
→ UNDER_ADMIN_REVIEW
→ ELIGIBLE_FOR_ACCEPTANCE
→ FORWARDED_TO_COUNCIL

Nhánh bổ sung:

UNDER_ADMIN_REVIEW
→ REVISION_REQUIRED
→ RESUBMITTED
→ UNDER_ADMIN_REVIEW

Lưu ý: trạng thái hồ sơ nghiệm thu không được dùng để biểu diễn kết quả Hội đồng nghiệm thu.

3.6. DecisionStatus

DRAFT
→ PENDING_SIGNATURE
→ SIGNED
→ ISSUED

Có nhánh:

PENDING_SIGNATURE
→ RETURNED
→ DRAFT/PENDING_SIGNATURE

4. Business gates bắt buộc

4.1. Gate chuyển SUBMITTED → WAITING_ASSIGNMENT

Không chuyển trực tiếp chỉ vì hồ sơ hành chính hợp lệ.

Điều kiện tối thiểu:

proposal_status = PROPOSAL_APPROVED, hoặc workflow policy cho phép bỏ qua scientific review theo cấu hình hợp lệ;

các yêu cầu chỉnh sửa sau Hội đồng đã hoàn tất;

project chưa bị REJECTED/TERMINATED.

4.2. Gate chuyển WAITING_ASSIGNMENT → IN_PROGRESS

Chỉ xảy ra khi:

đề cương đã hoàn tất;

Ethics = ETHICS_APPROVED hoặc NOT_REQUIRED;

Quyết định ASSIGNMENT đã ISSUED.

Không có macro-state ASSIGNED.

4.3. Gate chuyển IN_PROGRESS → WAITING_ACCEPTANCE

Chỉ khi đề tài đủ điều kiện nộp nghiệm thu theo policy, ví dụ:

đã đến/hoàn tất giai đoạn thực hiện;

các báo cáo tiến độ bắt buộc đã xử lý;

nghĩa vụ tài liệu bắt buộc đã hoàn tất;

không có blocking change request/ethics issue chưa giải quyết.

4.4. Gate chuyển WAITING_ACCEPTANCE → ACCEPTED

Không do màn kiểm tra hành chính quyết định.

Chỉ khi:

acceptance_dossier_status = FORWARDED_TO_COUNCIL;

Hội đồng nghiệm thu đã hoàn tất đánh giá;

MEETING_MINUTES.status = SIGNED;

Chủ tịch và Thư ký đã ký;

kết luận nghiệm thu đạt hoặc đạt có điều kiện theo policy.

4.5. Gate chuyển ACCEPTED → RECOGNIZED

Chỉ khi:

yêu cầu sửa sau nghiệm thu đã được xác nhận hoàn tất nếu có;

Quyết định RECOGNITION đã ISSUED.

4.6. Gate chuyển RECOGNIZED → CLOSED

Tùy policy, có thể yêu cầu:

hoàn tất nộp lưu;

hoàn tất nghĩa vụ tài chính;

tài liệu cuối kỳ đầy đủ;

không còn work item bắt buộc đang mở.

5. Ma trận thực thể theo capability

Capability

Thực thể chính

Thực thể hỗ trợ

Quản lý đợt đăng ký

REGISTRATION_ROUNDS

WORKFLOW_POLICIES

Đăng ký đề tài

PROJECTS

PROJECT_MEMBERS, PROJECT_DOCUMENTS

Thẩm định hành chính

PROJECTS.proposal_status

AUDIT_LOGS, WORK_ITEMS

Xét duyệt đề cương

COUNCILS, COUNCIL_PROJECT_ASSIGNMENTS

EVALUATION_RESULTS, MEETING_MINUTES

Đạo đức nghiên cứu

ETHICS_APPROVALS

ETHICS_STATUS_HISTORY, PROJECT_DOCUMENTS

Giao thực hiện

DECISIONS(type=ASSIGNMENT)

PROJECT_STATUS_HISTORY

Theo dõi tiến độ

PROGRESS_REPORTS, PROJECT_MILESTONES

WORK_ITEMS

Gia hạn/điều chỉnh

CHANGE_REQUESTS

CHANGE_REQUEST_DIFFS

Nghiệm thu

ACCEPTANCE_DOSSIERS

ACCEPTANCE_CHECKLIST_ITEMS, COUNCILS, MEETING_MINUTES

Hoàn thiện sau nghiệm thu

POST_ACCEPTANCE_REVISIONS

PROJECT_DOCUMENTS

Công nhận kết quả

DECISIONS(type=RECOGNITION)

PROJECT_STATUS_HISTORY

Tài chính

PROJECT_BUDGET_ITEMS, FINANCIAL_VOUCHERS

RESEARCH_CONTRACTS

Công bố/chuyển giao

PROJECT_PUBLICATIONS, CLINICAL_APPLICATIONS

PROJECT_DOCUMENTS

Dashboard/Task

WORK_ITEMS

NOTIFICATIONS

Truy vết

AUDIT_LOGS, PROJECT_STATUS_HISTORY

lịch sử các aggregate

6. Ma trận role và phạm vi dữ liệu

Role

Nghiệp vụ chính

Điều kiện phạm vi

RESEARCHER

Tạo/nộp/bổ sung hồ sơ, báo cáo tiến độ, change request, hồ sơ nghiệm thu

Chỉ đề tài mình là PI/chủ thể được phân quyền

RESEARCH_OFFICE

Thẩm định hành chính, quản lý Hội đồng, review tiến độ/điều chỉnh, lập/ban hành quyết định

Theo phạm vi đơn vị/quy trình

COUNCIL_MEMBER

Chấm điểm, ký/ghi nhận theo vai trò trong Hội đồng

Phải thuộc đúng COUNCIL_MEMBERS của Hội đồng

ETHICS_OFFICE

Tiếp nhận/thẩm định hồ sơ đạo đức

Chỉ workspace đạo đức

FINANCE_OFFICER

Xử lý nghiệp vụ tài chính

Chỉ module tài chính

DIRECTOR

Ký hoặc trả lại quyết định

Không mặc định thẩm định hồ sơ

ADMIN

Quản trị tài khoản, cấu hình hệ thống

Không tự động có quyền nghiệp vụ

CouncilRole như CHỦ_TỊCH, THƯ_KÝ, PHẢN_BIỆN, ỦY_VIÊN là vai trò của thành viên trong từng Hội đồng, không phải User.role.

7. Ràng buộc dữ liệu quan trọng

Một DECISION chỉ thuộc một PROJECT.

Mỗi project chỉ có tối đa một decision cùng loại đang hoạt động; RETURNED phải tiếp tục trên cùng bản decision thay vì tạo bản mới không cần thiết.

Số quyết định chính thức chỉ được cấp khi ban hành (ISSUED) theo quy trình của đơn vị.

PROJECT_DOCUMENTS là logical document; mỗi lần nộp lại tạo DOCUMENT_VERSIONS.

Không ghi đè lịch sử tài liệu cũ.

EVALUATION_RESULTS là nguồn sự thật cho việc thành viên đã nộp/chưa nộp đánh giá; không cần field evaluationSubmitted trên COUNCIL_MEMBERS.

Reviewer assignment phải lưu dạng danh sách, không hardcode reviewer1, reviewer2.

MEETING_MINUTES phải tách trạng thái soạn biên bản và chữ ký Chủ tịch/Thư ký.

Acceptance dossier không được chứa trạng thái ACCEPTED/REJECTED để thay thế kết quả Hội đồng.

reported_progress_percentage là số PI tự báo cáo, không mặc định đồng nghĩa “đúng tiến độ”.

KPI trễ hạn phải được suy ra từ due_date, target_date, milestone/report policy; không hardcode.

AUDIT_LOGS không thay thế state history chuyên biệt; hai loại phục vụ mục đích khác nhau.

Mọi delete nghiệp vụ quan trọng nên là soft-delete/archive hoặc có điều kiện chặt; project draft mới có thể xóa vật lý trong prototype.

Không cho UI tự tạo “file đã upload thành công” nếu chưa có document storage thực.

Trạng thái và permission phải được enforce ở service/repository/backend, không chỉ ẩn nút ở UI.

8. Các thực thể còn thiếu trong ERD cũ và lý do phải bổ sung

Thực thể bổ sung

Lý do

WORKFLOW_POLICIES

Tách cấu hình bệnh viện khỏi code; quản lý required docs, Ethics mode, report cadence, council policy

PROJECT_STATUS_HISTORY

Truy vết macro lifecycle đúng chuẩn

DOCUMENT_VERSIONS

Quản lý nộp lại/phiên bản hồ sơ

COUNCIL_PROJECT_ASSIGNMENTS

Một Hội đồng có thể xử lý nhiều đề tài và cần reviewer assignment theo từng đề tài

EVALUATION_RESULTS

Tách phiếu đánh giá khỏi member và minutes

ETHICS_STATUS_HISTORY

Theo dõi revision/approve/suspend/expire

ACCEPTANCE_DOSSIERS

Tách workflow kiểm tra hồ sơ nghiệm thu khỏi kết quả Hội đồng

ACCEPTANCE_CHECKLIST_ITEMS

Checklist hành chính phải lưu dữ liệu thật, không hardcode pass

POST_ACCEPTANCE_REVISIONS

Quản lý yêu cầu sửa sau nghiệm thu trước QĐ công nhận

DECISIONS

Quản lý riêng Assignment/Recognition và lifecycle ký-ban hành

CHANGE_REQUEST_DIFFS

Lưu rõ giá trị hiện tại/đề xuất/lý do cho từng thay đổi

WORK_ITEMS

Nguồn dữ liệu chuẩn cho Dashboard “việc cần xử lý” theo role/user

RESEARCH_CONTRACTS

Hỗ trợ trường hợp đề tài có hợp đồng/kinh phí

NOTIFICATIONS

Thông báo phải tách khỏi task và audit

9. Phân biệt Task, Notification và Audit

WORK_ITEMS

Trả lời câu hỏi: Ai đang phải làm gì, trước hạn nào?

Ví dụ:

Phòng NCKH phải thẩm định hồ sơ;

PI phải bổ sung đề cương;

thành viên Hội đồng phải nộp phiếu đánh giá;

Giám đốc phải ký quyết định.

NOTIFICATIONS

Trả lời câu hỏi: Người dùng cần được biết điều gì?

Thông báo không nhất thiết yêu cầu hành động.

AUDIT_LOGS

Trả lời câu hỏi: Ai đã làm gì với dữ liệu và lúc nào?

Audit không dùng để thay thế task hoặc notification.

10. Khuyến nghị triển khai database

10.1. Index nên có

PROJECTS(principal_investigator_id, status)

PROJECTS(registration_round_id, status)

PROJECTS(department_id, status)

PROJECTS(proposal_status)

PROJECTS(ethics_status)

COUNCIL_PROJECT_ASSIGNMENTS(council_id, project_id) unique

EVALUATION_RESULTS(council_id, project_id, council_member_id) unique

DECISIONS(project_id, type)

PROGRESS_REPORTS(project_id, due_date, status)

WORK_ITEMS(assignee_id, status, due_date)

NOTIFICATIONS(recipient_id, is_read, created_at)

AUDIT_LOGS(entity_name, entity_id, created_at)

10.2. Unique constraints

USERS.email

REGISTRATION_ROUNDS.round_code

PROJECTS.proposal_code

PROJECTS.project_code khi khác NULL

COUNCILS.council_code

DECISIONS.decision_number khi đã cấp số chính thức

10.3. Check constraints gợi ý

contribution percentage: 0 <= contribution_percentage <= 100

tổng tỷ lệ đóng góp nhóm nghiên cứu = 100% khi hồ sơ được nộp;

start_date <= end_date;

percentage: 0..100;

approved budget không âm;

vote counts không âm và pass_vote_count <= total_vote_count.

11. Kết luận kiến trúc

PROJECTS là aggregate gốc để tra cứu vòng đời, nhưng không phải nơi chứa toàn bộ logic nghiệp vụ.

Mô hình mục tiêu:

PROJECT
├── Proposal workflow
├── Ethics workflow
├── Council workflow
│   ├── EvaluationResult
│   └── MeetingMinutes
├── Decision workflow
├── Progress workflow
├── Change Request workflow
├── Acceptance workflow
├── Finance workflow
├── Document/version management
├── WorkItem / Notification
└── Audit / State history

Cách tách này giúp hệ thống tránh các lỗi phổ biến như:

một cột status phải biểu diễn hàng chục trạng thái khác nhau;

màn danh sách đề tài tự “approve” thay cho Hội đồng;

hồ sơ nghiệm thu tự chuyển project sang ACCEPTED;

ADMIN trở thành super-user nghiệp vụ;

dashboard dùng dữ liệu hardcode;

file upload giả không có version/history;

quyết định chưa ISSUED nhưng project đã chuyển trạng thái.