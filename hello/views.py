from django.shortcuts import render
from django.http import HttpResponse

from django import forms
import tempfile
import os
import mimetypes

from django.http import JsonResponse

from wordpress_xmlrpc import Client, WordPressPost
from wordpress_xmlrpc.compat import xmlrpc_client
from wordpress_xmlrpc.methods import media, posts

class UploadFileForm(forms.Form):
    title = forms.CharField(max_length=50)
    subtitle = forms.CharField(max_length=140)
    imgBase64 = forms.CharField()

# Create your views here.
def index(request):
    # return HttpResponse('Hello from Python!')
    return render(request, 'index.html')


def upload_file(request):
    client = Client('https://3panelstories.wordpress.com/xmlrpc.php', '3panelstories', 'Tr0janh0rse')
    if request.method == 'POST':
        form = UploadFileForm(request.POST)
        print form.is_valid()
        attachment_id = handle_uploaded_file(request.POST['imgBase64'], client, b64=True)
        post = WordPressPost()
        post.title = form.cleaned_data.get('title', 'Comic')
        post.content = form.cleaned_data.get('subtitle', 'Created at BLRLITFEST2016')
        post.post_status = 'publish'
        post.thumbnail = attachment_id
        post.id = client.call(posts.NewPost(post))
        post_info = client.call(posts.GetPost(post.id))
        return JsonResponse({'success':True, 'data':{'post_id':post.id, 'url': post_info.link}})
    else:
        return JsonResponse({'success':False, 'data':{}})

def handle_uploaded_file(f,client, b64=False):
    tempfile.tempdir = '/tmp/'
    tf = tempfile.NamedTemporaryFile(delete=False)
    if not b64:
        for chunk in f.chunks():
          tf.write(chunk)
    else:
        offset = f.find(',') + 1
        tf.write(f[offset:].decode('base64'))
    tf.close()
    data = {
            'name': 'picture.jpg',
            'type': 'image/png',  # mimetype
            }
    #data['type'] = mimetypes.read_mime_types(filename) or mimetypes.guess_type(filename)[0] or data['type']
    with open(tf.name, 'rb') as img:
        data['bits'] = xmlrpc_client.Binary(img.read())

    response = client.call(media.UploadFile(data))
    attachment_id = response['id']
    os.unlink(tf.name)
    return attachment_id
