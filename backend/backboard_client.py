
from backboard import BackboardClient

API_KEY = "espr_uErSJzLEMROoc_SSs6GC5zcxAQ2_g1-cfSAQU2nXOkk"

def get_client():
    return BackboardClient(api_key=API_KEY)