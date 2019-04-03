﻿// <copyright file="Constants.cs" company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.
// </copyright>

using System;

namespace AppLensV3.Helpers
{
    /// <summary>
    /// Github constants.
    /// </summary>
    internal static class GithubConstants
    {
        internal const string RawFileHeaderMediaType = "application/vnd.github.VERSION.raw";
        internal const string TemplatePath = "https://raw.githubusercontent.com/Azure/Azure-AppServices-Diagnostics/master/data/templates/{filename}.csx";
        internal const string SourceFilePathFormat = "https://api.github.com/repos/{0}/{1}/contents/{2}/{2}.csx?ref={3}&access_token={4}";
        internal const string ConfigPathFormat = "https://api.github.com/repos/{0}/{1}/contents/{2}/package.json?ref={3}&access_token={4}";
    }

    /// <summary>
    /// Kusto constants.
    /// </summary>
    internal static class KustoConstants
    {
        internal static readonly TimeSpan DefaultTimeGrain = TimeSpan.FromMinutes(5);
        internal const string MicrosoftTenantAuthorityUrl = "https://login.windows.net/microsoft.com";
        internal const int TokenRefreshIntervalInMs = 10 * 60 * 1000;   // 10 minutes
        internal const string DefaultKustoEndpoint = "https://wawswus.kusto.windows.net";
        internal const string KustoApiEndpointFormat = "https://{0}.kusto.windows.net:443/v1/rest/query";
    }
}
