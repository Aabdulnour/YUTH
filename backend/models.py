from dataclasses import dataclass

@dataclass
class UserProfile:
    user_id: str
    age: int
    province: str
    employment_status: str
    income_range: str
    housing_status: str
    has_student_loans: bool
    has_other_debt: bool
    has_children: bool
    indigenous_identity: str


@dataclass
class FinancialData:
    monthly_income: float
    monthly_expenses: float
    savings_goal: float
    budget_limit: float
    credit_score: int


@dataclass
class InsuranceInfo:
    provider: str
    monthly_cost: float
    renewal_date: str


@dataclass
class JobInfo:
    employer: str
    pay_schedule: str
    hourly_rate: float