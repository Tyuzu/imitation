---
layout: layouts/base.njk
title: Home
---

# Welcome to {{ site.name }}

{{ site.description }}

## Latest Posts

<ul>
{% for post in collections.posts | reverse %}
  <li>
    <a href="{{ post.url }}">{{ post.data.title }}</a>
    <small>&mdash; {{ post.date | readableDate }}</small>
  </li>
{% endfor %}
</ul>