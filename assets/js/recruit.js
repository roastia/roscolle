const UPLOAD_ENDPOINT = 'https://script.google.com/macros/s/AKfycbx8ZCQbwTcOg93woIGLXPkgUInqUl7E51RejNyF5Rpz-k1SAs16b99FTqpm9bSrVrSq/exec';
const REGISTER_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzKH66YJZ5UDvRz1nYeQwrN0G-NqMh_mzF3xtLZL_Jlef0TN7ndILT9o6y6yYs7U3gL/exec';

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

    const hasShipping = document.querySelector('#f_hasShipping').checked;
    const roastValues = Array.from(new Set(selectedChipValues('roast')));
    const flavorValues = Array.from(new Set(selectedChipValues('flavor')));

    const fields = {
      '店名': document.querySelector('#f_name').value,
      'ECサイトURL': document.querySelector('#f_ecUrl').value,
      'SNSアカウント': document.querySelector('#f_sns').value,
      '連絡先メールアドレス': document.querySelector('#f_email').value,
      '都道府県': document.querySelector('#f_prefecture').value,
      '写真': photoUrl,
      'ひとこと紹介文': document.querySelector('#f_description').value,
      '焙煎度合い': roastValues.join(', '),
      '香りの系統': flavorValues.join(', '),
      '送料無料ライン（円）': hasShipping ? document.querySelector('#f_shipping').value : '',
      '定期便（サブスク）の有無': document.querySelector('#f_subscription').checked ? '対応している' : '',
      'ギフト包装対応の有無': document.querySelector('#f_gift').checked ? '対応している' : '',
      '価格帯の下限（100gあたり・円）': document.querySelector('#f_priceMin').value,
      '価格帯の上限（100gあたり・円）': document.querySelector('#f_priceMax').value,
      '看板商品': document.querySelector('#f_flagship').value,
      '発送までの目安': document.querySelector('#f_shippingSpeed').value,
      'お試しセット・少量パックの有無': document.querySelector('#f_trial').checked ? 'あります' : '',
      '焙煎者の顔写真': roasterPhotoUrl,
      '焙煎者からのひとこと': document.querySelector('#f_roasterMessage').value,
      '食品衛生法に基づく営業届出': document.querySelector('#f_notification').checked ? '食品衛生法に基づく営業届出を提出済みです' : '',
      '届出番号（受理番号）': document.querySelector('#f_notificationNumber').value,
    };

    statusText.textContent = '登録内容を送信しています…';
    const response = await fetch(REGISTER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'submitRegistration', fields }),
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || '送信に失敗しました');

    entryForm.hidden = true;
    const thanks = document.querySelector('#thanks');
    thanks.style.display = 'block';
    thanks.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.body.classList.remove('form-busy');
  } catch (error) {
    statusText.textContent = `送信できませんでした：${error.message}。時間をおいてもう一度お試しください。`;
    button.disabled = false;
    document.body.classList.remove('form-busy');
  }
});
