import enum


class ObligationType(str, enum.Enum):
    annual_report = "annual_report"
    franchise_tax = "franchise_tax"
    boi_report = "boi_report"
    registered_agent_renewal = "registered_agent_renewal"


class ObligationStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    submitted = "submitted"
    done = "done"
