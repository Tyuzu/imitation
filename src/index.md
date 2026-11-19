---
layout: layouts/base.njk
title: Home
description: Browser-based tools that are simple, fast and private.
---
<section class="hero">
  <p class="eyebrow">TOOLS THAT JUST WORK</p>
  <h1>Welcome to {{ site.title }}</h1>
  <p>{{ site.description }}</p>
  <a class="btn-primary" href="{{ '/image-compressor/' | url }}">Try Image Compressor</a>
</section>
<section class="content-section">
  <h2>Latest articles</h2>
  <ul class="post-list">
    {% for post in collections.posts %}
      <li><a href="{{ post.url | url }}">{{ post.data.title }}</a><time datetime="{{ post.date | htmlDate }}">{{ post.date | readableDate }}</time></li>
    {% else %}
      <li>No articles published yet.</li>
    {% endfor %}
  </ul>
</section>
