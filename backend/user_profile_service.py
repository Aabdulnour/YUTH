from supabase_client import get_supabase_client

def load_user_profile(user_id: str):
    supabase = get_supabase_client()

    try:
        profile_response = (
            supabase.table("user_profiles")
            .select("*")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
    except Exception:
        profile_response = None

    try:
        financial_response = (
            supabase.table("financial_data")
            .select("*")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
    except Exception:
        financial_response = None

    profile_data = profile_response.data if profile_response and hasattr(profile_response, "data") else {}
    financial_data = financial_response.data if financial_response and hasattr(financial_response, "data") else {}

    return {
        "profile": profile_data or {},
        "financial": financial_data or {}
    }


def generate_user_context(user_data):
    profile = user_data.get("profile", {})
    financial = user_data.get("financial", {})

    return f"""
User profile:
Age: {profile.get('age')}
Province: {profile.get('province')}
Employed: {profile.get('employed')}
Student: {profile.get('student')}
Renter: {profile.get('renter')}
Has car: {profile.get('has_car')}
Has debt: {profile.get('has_debt')}
Lives with parents: {profile.get('lives_with_parents')}
Files taxes: {profile.get('files_taxes')}

Financial data:
Monthly income: {financial.get('monthly_income')}
Monthly expenses: {financial.get('monthly_expenses')}
Savings goal: {financial.get('savings_goal')}
Budget limit: {financial.get('budget_limit')}
Credit score: {financial.get('credit_score')}
"""