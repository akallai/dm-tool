import azure.functions as func
import json


def main(req: func.HttpRequest) -> func.HttpResponse:
    """Returns OpenAPI 3.0.0 specification for the DM Tool API."""

    openapi_spec = {
        "openapi": "3.0.0",
        "info": {
            "title": "DM Tool API",
            "description": "API for managing media files in the DM Tool application",
            "version": "1.0.0"
        },
        "servers": [
            {
                "url": "/api",
                "description": "API base path"
            }
        ],
        "paths": {
            "/health": {
                "get": {
                    "summary": "Health check",
                    "description": "Returns the health status of the API",
                    "operationId": "getHealth",
                    "tags": ["System"],
                    "responses": {
                        "200": {
                            "description": "API is healthy",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "status": {
                                                "type": "string",
                                                "example": "healthy"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/media": {
                "get": {
                    "summary": "List media files",
                    "description": "Returns a list of all media files in the storage container",
                    "operationId": "listMedia",
                    "tags": ["Media"],
                    "parameters": [
                        {
                            "name": "prefix",
                            "in": "query",
                            "description": "Filter files by name prefix",
                            "required": False,
                            "schema": {
                                "type": "string"
                            }
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "List of media files",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "files": {
                                                "type": "array",
                                                "items": {
                                                    "$ref": "#/components/schemas/FileMetadata"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "500": {
                            "$ref": "#/components/responses/InternalError"
                        }
                    }
                }
            },
            "/media/{filename}": {
                "get": {
                    "summary": "Download media file",
                    "description": "Downloads a specific media file by filename",
                    "operationId": "getMedia",
                    "tags": ["Media"],
                    "parameters": [
                        {
                            "name": "filename",
                            "in": "path",
                            "description": "Name of the file to download",
                            "required": True,
                            "schema": {
                                "type": "string"
                            }
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "File content",
                            "content": {
                                "application/octet-stream": {
                                    "schema": {
                                        "type": "string",
                                        "format": "binary"
                                    }
                                }
                            }
                        },
                        "400": {
                            "$ref": "#/components/responses/BadRequest"
                        },
                        "404": {
                            "$ref": "#/components/responses/NotFound"
                        },
                        "500": {
                            "$ref": "#/components/responses/InternalError"
                        }
                    }
                },
                "put": {
                    "summary": "Upload media file",
                    "description": "Uploads a new media file or replaces an existing one",
                    "operationId": "uploadMedia",
                    "tags": ["Media"],
                    "parameters": [
                        {
                            "name": "filename",
                            "in": "path",
                            "description": "Name for the uploaded file",
                            "required": True,
                            "schema": {
                                "type": "string"
                            }
                        }
                    ],
                    "requestBody": {
                        "description": "File content to upload",
                        "required": True,
                        "content": {
                            "application/octet-stream": {
                                "schema": {
                                    "type": "string",
                                    "format": "binary"
                                }
                            }
                        }
                    },
                    "responses": {
                        "201": {
                            "description": "File uploaded successfully",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "message": {
                                                "type": "string",
                                                "example": "File uploaded successfully"
                                            },
                                            "filename": {
                                                "type": "string"
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            "$ref": "#/components/responses/BadRequest"
                        },
                        "500": {
                            "$ref": "#/components/responses/InternalError"
                        }
                    }
                },
                "delete": {
                    "summary": "Delete media file",
                    "description": "Deletes a specific media file by filename",
                    "operationId": "deleteMedia",
                    "tags": ["Media"],
                    "parameters": [
                        {
                            "name": "filename",
                            "in": "path",
                            "description": "Name of the file to delete",
                            "required": True,
                            "schema": {
                                "type": "string"
                            }
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "File deleted successfully",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "message": {
                                                "type": "string",
                                                "example": "File deleted successfully"
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            "$ref": "#/components/responses/BadRequest"
                        },
                        "404": {
                            "$ref": "#/components/responses/NotFound"
                        },
                        "500": {
                            "$ref": "#/components/responses/InternalError"
                        }
                    }
                }
            }
        },
        "components": {
            "schemas": {
                "FileMetadata": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "File name"
                        },
                        "size": {
                            "type": "integer",
                            "description": "File size in bytes"
                        },
                        "content_type": {
                            "type": "string",
                            "description": "MIME type of the file",
                            "nullable": True
                        },
                        "last_modified": {
                            "type": "string",
                            "format": "date-time",
                            "description": "Last modification timestamp",
                            "nullable": True
                        }
                    }
                },
                "Error": {
                    "type": "object",
                    "properties": {
                        "error": {
                            "type": "string",
                            "description": "Error message"
                        }
                    }
                }
            },
            "responses": {
                "BadRequest": {
                    "description": "Bad request - missing or invalid parameters",
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/Error"
                            },
                            "example": {
                                "error": "Filename is required"
                            }
                        }
                    }
                },
                "NotFound": {
                    "description": "Resource not found",
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/Error"
                            },
                            "example": {
                                "error": "File not found"
                            }
                        }
                    }
                },
                "InternalError": {
                    "description": "Internal server error",
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/Error"
                            },
                            "example": {
                                "error": "Storage not configured"
                            }
                        }
                    }
                }
            }
        }
    }

    return func.HttpResponse(
        json.dumps(openapi_spec, indent=2),
        mimetype="application/json",
        status_code=200
    )
