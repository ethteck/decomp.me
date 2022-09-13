# Generated by Django 3.2.4 on 2021-10-13 12:03

import django.db.migrations.operations.special
from django.apps.registry import Apps
from django.db import migrations, models
from django.db.backends.base.schema import BaseDatabaseSchemaEditor


def populate_name(apps: Apps, schema_editor: BaseDatabaseSchemaEditor) -> None:
    """
    Populate the name field for all existing scratches
    """
    Scratch = apps.get_model("coreapp", "Scratch")
    for row in Scratch.objects.all():
        row.name = row.diff_label if row.diff_label else ""
        row.save()


class Migration(migrations.Migration):

    dependencies = [
        ("coreapp", "0005_scratch_arch"),
    ]

    operations = [
        migrations.AddField(
            model_name="scratch",
            name="score",
            field=models.IntegerField(default=-1),
        ),
        migrations.AddField(
            model_name="scratch",
            name="description",
            field=models.TextField(blank=True, default="", max_length=5000),
        ),
        migrations.AddField(
            model_name="scratch",
            name="name",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.RunPython(
            code=populate_name,
            reverse_code=django.db.migrations.operations.special.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="scratch",
            name="cc_opts",
            field=models.TextField(blank=True, default="", max_length=1000),
        ),
    ]
