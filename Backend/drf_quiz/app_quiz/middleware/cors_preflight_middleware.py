from django.http import JsonResponse

def cors_preflight_middleware(get_response):
    def middleware(request):
        if request.method == 'OPTIONS':
            response = JsonResponse({"message": "CORS preflight response"})
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PATCH, PUT, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Authorization, Content-Type'
            return response
        return get_response(request)

    return middleware
