const UPLOAD_ENDPOINT = 'https://script.google.com/macros/s/AKfycbx8ZCQbwTcOg93woIGLXPkgUInqUl7E51RejNyF5Rpz-k1SAs16b99FTqpm9bSrVrSq/exec';

document.querySelectorAll('.chip-group').forEach((group) => {
  group.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      chip.setAttribute('aria-pressed', String(chip.classList.contains('active')));
    });
  });
});

const hasShippingCheckbox = document.querySelector('#f_hasShipping');
const shippingField = document.querySelector('#f_shippingField');
if (hasShippingCheckbox && shippingField) {
  hasShippingCheckbox.addEventListener('change', () => {
    shippingField.hidden = !hasShippingCheckbox.checked;
    if (!hasShippingCheckbox.checked) {
      document.querySelector('#f_shipping').value = '';
    }
  });
}

function selectedChipValues(groupName) {
  const group = document.querySelector(`.chip-group[data-group="${groupName}"]`);
  return Array.from(group.querySelectorAll('.chip.active')).map((chip) => chip.dataset.value);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadPhoto(file) {
  if (!file) return '';
  const base64 = await fileToBase64(file);
  const response = await fetch(UPLOAD_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ base64, mimeType: file.type, filename: file.name }),
  });
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || '写真のアップロードに失敗しました');
  return data.url;
}

const entryForm = document.querySelector('#entryForm');

entryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = document.querySelector('#f_submitBtn');
  const statusText = document.querySelector('#f_statusText');
  button.disabled = true;
  document.body.classList.add('form-busy');

  try {
    statusText.textContent = '写真をアップロードしています…';
    const photoUrl = await uploadPhoto(document.querySelector('#f_photo').files[0]);
    const roasterPhotoFile = document.querySelector('#f_roasterPhoto').files[0];
    const roasterPhotoUrl = roasterPhotoFile ? await uploadPhoto(roasterPhotoFile) : '';

    const directMappings = {
      g_name: 'f_name',
      g_ecUrl: 'f_ecUrl',
      g_sns: 'f_sns',
      g_email: 'f_email',
      g_prefecture: 'f_prefecture',
      g_description: 'f_description',
      g_shipping: 'f_shipping',
      g_notificationNumber: 'f_notificationNumber',
      g_flagship: 'f_flagship',
      g_shippingSpeed: 'f_shippingSpeed',
      g_roasterMessage: 'f_roasterMessage',
    };

    Object.entries(directMappings).forEach(([targetId, sourceId]) => {
      document.getElementById(targetId).value = document.getElementById(sourceId).value;
    });
    document.querySelector('#g_photo').value = photoUrl;
    document.querySelector('#g_roasterPhoto').value = roasterPhotoUrl;

    selectedChipValues('roast').forEach((value) => {
      document.getElementById(`g_roast_${value}`).checked = true;
    });
    selectedChipValues('flavor').forEach((value) => {
      document.getElementById(`g_flavor_${value}`).checked = true;
    });
    document.querySelector('#g_subscription').checked = document.querySelector('#f_subscription').checked;
    document.querySelector('#g_gift').checked = document.querySelector('#f_gift').checked;
    document.querySelector('#g_trial').checked = document.querySelector('#f_trial').checked;
    document.querySelector('#g_notification').checked = document.querySelector('#f_notification').checked;

    statusText.textContent = '登録内容を送信しています…';
    document.querySelector('#googleForm').submit();

    window.setTimeout(() => {
      entryForm.hidden = true;
      const thanks = document.querySelector('#thanks');
      thanks.style.display = 'block';
      thanks.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.body.classList.remove('form-busy');
    }, 1200);
  } catch (error) {
    statusText.textContent = `送信できませんでした：${error.message}。時間をおいてもう一度お試しください。`;
    button.disabled = false;
    document.body.classList.remove('form-busy');
  }
});
