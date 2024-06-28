# Django imports
from django.db.models import (
    Exists,
    OuterRef,
)

# Third Party imports
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

# Module imports
from .base import BaseAPIView
from plane.app.serializers import DeployBoardSerializer
from plane.db.models import (
    Project,
    DeployBoard,
)


class DeployBoardPublicSettingsEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def get(self, request, anchor):
        deploy_board = DeployBoard.objects.get(anchor=anchor)
        serializer = DeployBoardSerializer(deploy_board)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkspaceProjectDeployBoardEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def get(self, request, anchor):
        deploy_board = DeployBoard.objects.filter(
            anchor=anchor, entity_name="project"
        ).values_list
        projects = (
            Project.objects.filter(workspace=deploy_board.workspace)
            .annotate(
                is_public=Exists(
                    DeployBoard.objects.filter(
                        anchor=anchor,
                        project_id=OuterRef("pk"),
                        entity_name="project",
                    )
                )
            )
            .filter(is_public=True)
        ).values(
            "id",
            "identifier",
            "name",
            "description",
            "emoji",
            "icon_prop",
            "cover_image",
        )

        return Response(projects, status=status.HTTP_200_OK)


class WorkspaceProjectAnchorEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def get(self, request, slug, project_id):
        project_deploy_board = DeployBoard.objects.get(
            workspace__slug=slug, project_id=project_id
        )
        serializer = DeployBoardSerializer(project_deploy_board)
        return Response(serializer.data, status=status.HTTP_200_OK)
