import numpy as np
from numba import njit
from numba.typed import List

def calculate_iou_matrix(masks):
    masks_list = List()
    for mask in masks:
        masks_list.append(mask)
    return calculate_iou_matrix_(masks_list)


@njit
def calculate_iou_matrix_(masks):
    n = len(masks)
    iou_mat = np.zeros((n, n))

    for i in range(n):
        for j in range(n):
            intersection = np.sum(masks[i] & masks[j])
            union = np.sum(masks[i] | masks[j])
            if union == 0:
                iou_mat[i, j] = 0.0
            else:
                iou_mat[i, j] = intersection / union

    return iou_mat

# def calculate_iou_matrix(masks):
#     n = len(masks)
#     masks = np.array(masks)  # Convert list to a NumPy array
#     iou_mat = np.zeros((n, n))

#     # Calculate intersection and union
#     intersection = np.zeros((n, n))
#     union = np.zeros((n, n))

#     for i in range(n):
#         intersection[i] = np.sum(masks[i] & masks, axis=(1, 2))
#         union[i] = np.sum(masks[i] | masks, axis=(1, 2))

#     # Avoid division by zero
#     union[union == 0] = 1e-10  # Small epsilon to prevent division by zero

#     iou_mat = intersection / union
#     return iou_mat


def test_iou_matrix():
    # Test case 1: Identical masks
    masks1 = [
        np.array([[1, 1], [1, 1]]),  # Mask 1
        np.array([[1, 1], [1, 1]]),  # Mask 2
    ]
    expected_iou1 = np.array([[1.0, 1.0], [1.0, 1.0]])
    assert np.allclose(calculate_iou_matrix(masks1), expected_iou1)

    # Test case 2: No overlap
    masks2 = [
        np.array([[1, 0], [0, 0]]),  # Mask 1
        np.array([[0, 1], [0, 0]]),  # Mask 2
    ]
    expected_iou2 = np.array([[1.0, 0.0], [0.0, 1.0]])
    assert np.allclose(calculate_iou_matrix(masks2), expected_iou2)

    # Test case 3: Partial overlap
    masks3 = [
        np.array([[1, 1], [0, 0]]),  # Mask 1
        np.array([[1, 0], [1, 1]]),  # Mask 2
    ]
    expected_iou3 = np.array([[1.0, 1 / 4], [1 / 4, 1.0]], dtype=np.float32)
    assert np.allclose(calculate_iou_matrix(masks3), expected_iou3, rtol=1e-04)

    # Test case 4: Empty masks
    masks4 = [
        np.array([[0, 0], [0, 0]]),  # Mask 1
        np.array([[0, 0], [0, 0]]),  # Mask 2
    ]
    expected_iou4 = np.array([[0.0, 0.0], [0.0, 0.0]])
    assert np.allclose(calculate_iou_matrix(masks4), expected_iou4)

    # Test case 5: Mixed masks
    masks5 = [
        np.array([[1, 1], [0, 0]]),  # Mask 1
        np.array([[1, 0], [1, 0]]),  # Mask 2
        np.array([[0, 1], [0, 1]]),  # Mask 3
    ]
    expected_iou5 = np.array(
        [[1.0, 1 / 3, 1 / 3], [1 / 3, 1.0, 0], [1 / 3, 0, 1.0]],
        dtype=np.float32,
    )

    assert np.allclose(calculate_iou_matrix(masks5), expected_iou5, rtol=1e-04)

    print("All tests passed!")


def filter_masks_by_iou(iou_matrix, threshold):

    n = iou_matrix.shape[0]
    # Initialize a list to collect indices of masks to keep
    filtered_indices = []

    # Keep track of which masks are already included
    keep_mask = np.zeros(n, dtype=bool)

    for i in range(n):
        if not keep_mask[i]:  # If this mask has not been kept
            filtered_indices.append(i)
            # Mark all masks with IoU > threshold as kept
            keep_mask[iou_matrix[i] > threshold] = True

    return filtered_indices


def test_filter_masks_by_iou():
    # Test case 1: All masks below the threshold
    iou_matrix1 = np.array([[1.0, 0.1, 0.2], [0.1, 1.0, 0.1], [0.2, 0.1, 1.0]])
    threshold1 = 0.3
    expected_output1 = [0, 1, 2]  # All masks are below the threshold
    assert filter_masks_by_iou(iou_matrix1, threshold1) == expected_output1

    # Test case 2: Some masks above the threshold
    iou_matrix2 = np.array([[1.0, 0.4, 0.2], [0.4, 1.0, 0.1], [0.2, 0.1, 1.0]])
    threshold2 = 0.3
    expected_output2 = [0, 2]  # Keep one instance of mask 0 and 2
    assert filter_masks_by_iou(iou_matrix2, threshold2) == expected_output2

    # Test case 3: Identical masks
    iou_matrix3 = np.array([[1.0, 1.0], [1.0, 1.0]])
    threshold3 = 0.5
    expected_output3 = [0]  # Keep only one mask
    print(filter_masks_by_iou(iou_matrix3, threshold3))
    assert filter_masks_by_iou(iou_matrix3, threshold3) == expected_output3

    # Test case 5: Mixed IoU values
    iou_matrix5 = np.array([[1.0, 0.5, 0.3], [0.5, 1.0, 0.4], [0.3, 0.4, 1.0]])
    threshold5 = 0.4
    expected_output5 = [0, 2]  # Keep one instance of 0 and 2
    assert filter_masks_by_iou(iou_matrix5, threshold5) == expected_output5

    print("All tests passed!")


# Run the test cases
test_iou_matrix()
