import json

def load_user_profile(user_id: str):
    with open(f"data/users/{user_id}.json") as f:
        return json.load(f)


def generate_user_context(profile):
    context = f"""
User profile:
Age: {profile['age']}
Province: {profile['province']}
Employment: {profile['employment_status']}
Housing: {profile['housing_status']}
Income: {profile['income_range']}
Student loans: {profile['student_loans']}
Debt: {profile['debt']}
Children: {profile['children']}
"""

    return context