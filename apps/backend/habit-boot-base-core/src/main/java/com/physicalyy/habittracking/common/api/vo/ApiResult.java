package com.physicalyy.habittracking.common.api.vo;

public record ApiResult<T>(
        boolean success,
        String code,
        String message,
        T data
) {

    public static <T> ApiResult<T> ok(T data) {
        return new ApiResult<>(true, "OK", "ok", data);
    }
}
