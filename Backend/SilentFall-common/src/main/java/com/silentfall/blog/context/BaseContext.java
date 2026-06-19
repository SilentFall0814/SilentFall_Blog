package com.silentfall.blog.context;

public class BaseContext {

    public static ThreadLocal<String> threadLocal = new ThreadLocal<>();
    public static ThreadLocal<Integer> roleThreadLocal = new ThreadLocal<>();

    public static void setCurrentId(String id) {
        threadLocal.set(id);
    }

    public static String getCurrentId() {
        return threadLocal.get();
    }

    public static void removeCurrentId() {
        threadLocal.remove();
    }

    public static void setCurrentRole(Integer role) {
        roleThreadLocal.set(role);
    }

    public static Integer getCurrentRole() {
        return roleThreadLocal.get();
    }

    public static void removeCurrentRole() {
        roleThreadLocal.remove();
    }

}
