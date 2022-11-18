import os
import logging
import subprocess
import requests

import tempfile

logger = logging.getLogger(__name__)


def get_html_with_script(html, prefix):
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, 'html.parser')
    new_scripts = soup.new_tag('script')
    new_style = soup.new_tag('style')

    scripts = soup.find('head').findAll('script')
    script_code = ''
    for script in scripts:
        src_url = script['src']
        if not src_url.startswith('http'):
            src_url = prefix + src_url
        src = requests.get(src_url, verify=False)
        script.decompose()
        # new_scripts.append(src.text)
        script_code += '\n' +src.text

    styles = soup.find('head').findAll('link')
    for style in styles:
        src_url = style['href']
        if not src_url.startswith('http'):
            src_url = prefix + src_url
        src = requests.get(src_url, verify=False)
        style.decompose()
        new_style.append(src.text)

    try:
        ulified_js = uglifyjs(
            script_code.encode(),
            '-c', '-m')
        new_scripts.append(ulified_js)
    except Exception as e:
        new_scripts.append(script_code)

    soup.find('head').append(new_scripts)


    soup.find('head').append(new_style)
    return str(soup)


def uglifyjs(code, *options):
    if isinstance(code, bytes):
        mode = 'wb'
    else:
        mode = 'w'
    with tempfile.NamedTemporaryFile(mode=mode, delete=False) as fp:
        fp.write(code)
    out = tempfile.NamedTemporaryFile(mode='w', delete=False)
    try:
        uglify_cmd = os.environ.get('UGLIFYJS_CMD', 'uglifyjs.cmd')
        file_name = fp.name
        command_line = [
            uglify_cmd, file_name,
            *options,
            '-o', out.name
        ]

        sproc = subprocess.Popen(
            command_line, shell=False,  # important to set shell=False
            stdout=subprocess.PIPE,
            stdin=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        sproc.stdin.close()
        sproc.wait(timeout=100)  # in seconds

        logger.info("uglifyjs exit code: {}".format(sproc.returncode))

        if sproc.returncode > 0:
            e = Exception(sproc.stderr.read().decode())
            logger.error(e)
            raise(e)

        # msg = sproc.stdout.read().decode('utf8')
        with open(out.name, 'rb') as f:
            msg = f.read().decode()

        return msg
    except Exception as e:
        raise(e)
    finally:
        try:
            os.remove(file_name)
            os.remove(out.name)
        except Exception:
            pass


if __name__ == '__main__':
    with open('./script.js', 'rb') as f:
        code = f.read()
    aa = uglifyjs(code, '-c', '-m')
    print(aa[:100])
