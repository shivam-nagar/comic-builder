from django.shortcuts import render
from django.http import HttpResponse

from django import forms
import tempfile

from django.http import JsonResponse

from wordpress_xmlrpc import Client, WordPressPost
from wordpress_xmlrpc.compat import xmlrpc_client
from wordpress_xmlrpc.methods import media, posts

class UploadFileForm(forms.Form):
    title = forms.CharField(max_length=50)
    file = forms.FileField()

# Create your views here.
def index(request):
    # return HttpResponse('Hello from Python!')
    return render(request, 'index.html')


def upload_file(request):
    if request.method == 'POST':
        form = UploadFileForm(request.POST, request.FILES)
        if form.is_valid():
            attachment_id = handle_uploaded_file(request.FILES['file'])
            post = WordPressPost()
            post.title = form.title
            post.content = ''
            post.post_status = 'publish'
            post.thumbnail = attachment_id
            post.id = client.call(posts.NewPost(post))

            return JsonResponse({'success':True, 'data':{'post_id':post.id}})
    else:
            return JsonResponse({'success':False, 'data':{}})

def handle_uploaded_file(f):
    client = Client('https://3panelstories.wordpress.com/xmlrpc.php', '3panelstories', 'Tr0janh0rse')
    data = {
            'name': 'picture.jpg',
            'type': 'image/jpeg',  # mimetype
            }
    for chunk in f.chunks():
        data['bits'] = xmlrpc_client.Binary(img.read())
    response = client.call(media.UploadFile(data))
    attachment_id = response['id']
    return attachment_id
