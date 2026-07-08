# 立花しろ — 公式サイト

Claude Design のプロトタイプ（`project/立花しろ スプラッシュ.dc.html`）を、依存なしの静的サイトとして書き起こしたものです。ビルド不要 — `index.html` をそのまま任意の静的ホスティング（Netlify, GitHub Pages, S3 など）にデプロイするか、ローカルで開いて確認できます。

## 構成
```
index.html
css/style.css
js/main.js
assets/img/
  futari-a.png   左側（ピンク髪）のイラスト
  futari-b.png   右側（黒髪）のイラスト
  ogp.png        SNSシェア用OGP画像
```

## ギャラリー画像・ポートレートについて
ギャラリーの10枠とプロフィールのポートレートは、現在すべてプレースホルダー（点線枠＋キャプション）です。実際の作品画像に差し替えるには：

1. 画像ファイルを `assets/img/` に追加（例: `work-1.jpg`）
2. `index.html` 内の該当する `<div class="placeholder-slot ...">...</div>` を `<img src="assets/img/work-1.jpg" alt="">` に置き換え

ギャラリーの枠は `gallery-card__zoom` 内の要素にホバーで自動的にズームします（追加のCSS/JSは不要）。ポートレートは `profile__portrait` の中身を差し替えるだけです。

## お問い合わせフォームについて
現在は `mailto:` 方式です（送信ボタンを押すと訪問者のメールソフトが開き、宛先・件名・本文が入った状態になります）。訪問者の環境にメールアプリが設定されていないと開かない場合があるため、確実に受信したい場合は Formspree 等のフォーム送信サービスへの切り替えをおすすめします（`js/main.js` の `setupContactForm` を差し替えるだけで対応できます）。

## 公開時の注意
- `og:image`（`index.html` 内）は相対パスになっています。公開後は実際のドメインを含む絶対URLに直してください。
- SNSリンク（X / pixiv / FANBOX / DLsite）は既に実際のURLが設定済みです。
