# Generated by Django 3.2.6 on 2021-09-02 21:53

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("coreapp", "0002_remove_assembly_as_opts"),
    ]

    operations = [
        migrations.CreateModel(
            name="GitHubUser",
            fields=[
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        primary_key=True,
                        related_name="github",
                        serialize=False,
                        to="auth.user",
                    ),
                ),
                ("github_id", models.PositiveIntegerField(editable=False, unique=True)),
                ("access_token", models.CharField(max_length=100)),
            ],
            options={
                "verbose_name": "GitHub user",
                "verbose_name_plural": "GitHub users",
            },
        ),
        migrations.AddField(
            model_name="profile",
            name="creation_date",
            field=models.DateTimeField(
                auto_now_add=True, default=django.utils.timezone.now
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="profile",
            name="last_request_date",
            field=models.DateTimeField(
                auto_now_add=True, default=django.utils.timezone.now
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="profile",
            name="user",
            field=models.OneToOneField(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="profile",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
